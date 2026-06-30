import { NextResponse } from "next/server";
import { z } from "zod";
import { getAiProviderName, getReceiptParser } from "@/lib/ai";
import { addReviewMetadataToLineItems } from "@/lib/ai/line-items";
import { isAiScanMode, normalizeAiScanMode } from "@/lib/ai/scan-modes";
import type { AiScanMode, AnyAiScanMode } from "@/lib/ai/types";
import {
  calculateCandidateReportableAmount,
  normalizeAllocationPercentage
} from "@/lib/calculations/allocation";
import { canRunAiScan } from "@/lib/stripe/entitlements";
import { createClient } from "@/lib/supabase/server";
import { apiError, logServerError, parseJsonBody } from "@/server/reporting/api";
import { requireApprovedUserIdForApi } from "@/server/reporting/approval";
import type { SupabaseReportingClient } from "@/server/reporting/db";
import { getCategories } from "@/server/reporting/queries";
import type { ReceiptRow, SourceDocumentRow } from "@/server/reporting/types";

const reparseReceiptSchema = z.object({
  receiptId: z.string().uuid(),
  scanMode: z
    .preprocess(
      (value) => {
        if (value === "" || value === null || value === undefined) return "plus";
        return value;
      },
      z.custom<AnyAiScanMode>((value) => isAiScanMode(value), "Invalid scan mode.")
    )
    .transform((value) => normalizeAiScanMode(value))
});

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;

  return "Plus scan failed.";
}

async function hasAiConsent(db: SupabaseReportingClient, userId: string) {
  const { data, error } = await db
    .from("profiles")
    .select("ai_processing_consent_at")
    .eq("id", userId)
    .single();

  if (error || !data) return false;

  return Boolean(
    (data as { ai_processing_consent_at?: string | null }).ai_processing_consent_at
  );
}

async function markFailure({
  db,
  receiptId,
  sourceDocumentId,
  userId,
  message
}: {
  db: SupabaseReportingClient;
  receiptId: string;
  sourceDocumentId?: string | null;
  userId: string;
  message: string;
}) {
  await db
    .from("receipts")
    .update({ status: "failed", ai_error_message: message })
    .eq("id", receiptId)
    .eq("user_id", userId);

  if (sourceDocumentId) {
    await db
      .from("source_documents")
      .update({ status: "failed", error_message: message })
      .eq("id", sourceDocumentId)
      .eq("user_id", userId);
  }
}

async function recordUsage(
  db: SupabaseReportingClient,
  userId: string,
  scanMode: "standard" | "plus" | "pro",
  metadata: Record<string, unknown>
) {
  await db.from("usage_events").insert({
    user_id: userId,
    event_type: `ai_scan_${scanMode}`,
    metadata
  });
}

export async function POST(request: Request) {
  const approval = await requireApprovedUserIdForApi();

  if (approval.response) return approval.response;

  const userId = approval.userId;

  const parsed = await parseJsonBody(request, reparseReceiptSchema);

  if (parsed.error || !parsed.data) {
    return apiError(parsed.error ?? "Invalid receipt re-scan request.");
  }

  const scanMode = parsed.data.scanMode as AiScanMode;
  const scanAccess = await canRunAiScan(userId, scanMode);

  if (!scanAccess.allowed) {
    return apiError(scanAccess.reason ?? "Receipt scan is not available.", 403);
  }

  const supabase = await createClient();
  const db = supabase as unknown as SupabaseReportingClient;
  const { data: receiptData, error: receiptError } = await db
    .from("receipts")
    .select("*, source_documents(*)")
    .eq("id", parsed.data.receiptId)
    .eq("user_id", userId)
    .single();

  if (receiptError || !receiptData) return apiError("Receipt not found.", 404);

  const receipt = receiptData as ReceiptRow;
  const sourceDocument = receipt.source_documents as SourceDocumentRow | null;

  if (!sourceDocument?.original_file_path) {
    return apiError("Original receipt file is not available for Plus scan.", 400);
  }

  if (getAiProviderName() !== "mock" && !(await hasAiConsent(db, userId))) {
    return apiError("AI processing consent is required before parsing receipts.", 403);
  }

  await db
    .from("receipts")
    .update({ status: "processing", ai_error_message: null })
    .eq("id", receipt.id)
    .eq("user_id", userId);
  await db
    .from("source_documents")
    .update({ status: "processing", error_message: null })
    .eq("id", sourceDocument.id)
    .eq("user_id", userId);

  const download = await supabase.storage
    .from("receipt-originals")
    .download(sourceDocument.original_file_path);

  if (download.error || !download.data) {
    const message = download.error?.message ?? "Receipt file was not uploaded.";
    await markFailure({
      db,
      receiptId: receipt.id,
      sourceDocumentId: sourceDocument.id,
      userId,
      message
    });

    logServerError("ai.reparse.storage", download.error);
    return apiError("Receipt file was not uploaded or could not be read.", 400);
  }

  try {
    const categories = await getCategories();
    const result = await getReceiptParser()({
      fileBuffer: Buffer.from(await download.data.arrayBuffer()),
      mimeType: sourceDocument.mime_type ?? "application/octet-stream",
      fileName: sourceDocument.original_file_name ?? undefined,
      scanMode,
      currencyHint: "EUR",
      categoryHints: categories.map((category) => category.name)
    });
    const suggestedCategory = categories.find(
      (category) => category.name === result.receipt.suggested_category
    );
    const lineItems = addReviewMetadataToLineItems({
      items: result.receipt.items,
      categories,
      fallbackCategoryName: result.receipt.suggested_category
    });
    const normalizedReceipt = {
      ...result.receipt,
      items: lineItems
    };
    const totalAmount = result.receipt.total_amount ?? 0;
    const allocationPercentage = normalizeAllocationPercentage("manual_percentage", 100);
    const candidateReportableAmount = calculateCandidateReportableAmount(
      totalAmount,
      allocationPercentage
    );

    await db
      .from("receipts")
      .update({
        status: "needs_review",
        ai_provider: result.provider,
        ai_model: result.model,
        ai_scan_mode: result.scanMode,
        ai_confidence: normalizedReceipt.confidence,
        ai_raw_response: result.rawResponse,
        ai_normalized_response: normalizedReceipt,
        ai_error_message: null
      })
      .eq("id", receipt.id)
      .eq("user_id", userId);

    if (receipt.expense_entry_id) {
      await db
        .from("expense_entries")
        .update({
          date: result.receipt.date,
          vendor: result.receipt.vendor,
          vendor_normalized: result.receipt.vendor?.toLowerCase() ?? null,
          category_id: suggestedCategory?.id ?? null,
          total_amount: totalAmount,
          tax_amount: result.receipt.tax_amount,
          currency: result.receipt.currency ?? "EUR",
          allocation_method: "manual_percentage",
          allocation_percentage: allocationPercentage,
          candidate_reportable_amount: candidateReportableAmount,
          status: "draft",
          notes: "Updated from Plus scan. Review before reporting.",
          items: lineItems
        })
        .eq("id", receipt.expense_entry_id)
        .eq("user_id", userId);
    }

    await db
      .from("source_documents")
      .update({ status: "processed", error_message: null })
      .eq("id", sourceDocument.id)
      .eq("user_id", userId);
    await recordUsage(db, userId, result.scanMode, {
      provider: result.provider,
      model: result.model,
      receiptId: receipt.id,
      sourceDocumentId: sourceDocument.id
    });

    return NextResponse.json({ data: { receiptId: receipt.id } });
  } catch (error) {
    const message = getErrorMessage(error);
    logServerError(`ai.reparse.provider.${getAiProviderName()}.${scanMode}`, error);
    await markFailure({
      db,
      receiptId: receipt.id,
      sourceDocumentId: sourceDocument.id,
      userId,
      message
    });

    return apiError("Unable to parse receipt with AI.", 500);
  }
}
