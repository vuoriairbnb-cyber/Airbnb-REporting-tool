import { NextResponse } from "next/server";
import { z } from "zod";
import { getAiProviderName, getReceiptParser } from "@/lib/ai";
import {
  calculateCandidateReportableAmount,
  normalizeAllocationPercentage
} from "@/lib/calculations/allocation";
import { canRunAiScan } from "@/lib/stripe/entitlements";
import { createClient } from "@/lib/supabase/server";
import { apiError, logServerError, parseJsonBody } from "@/server/reporting/api";
import type { SupabaseReportingClient } from "@/server/reporting/db";
import { getCategories, getCurrentUserId } from "@/server/reporting/queries";
import type { ReceiptRow, SourceDocumentRow } from "@/server/reporting/types";

const reparseReceiptSchema = z.object({
  receiptId: z.string().uuid()
});

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;

  return "Accurate receipt scan failed.";
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
  metadata: Record<string, unknown>
) {
  await db.from("usage_events").insert({
    user_id: userId,
    event_type: "ai_scan_accurate",
    metadata
  });
}

export async function POST(request: Request) {
  const userId = await getCurrentUserId();

  if (!userId) return apiError("Authentication required.", 401);

  const parsed = await parseJsonBody(request, reparseReceiptSchema);

  if (parsed.error || !parsed.data) {
    return apiError(parsed.error ?? "Invalid receipt re-scan request.");
  }

  const scanAccess = await canRunAiScan(userId, "accurate");

  if (!scanAccess.allowed) {
    return apiError(scanAccess.reason ?? "Accurate scan is not available.", 403);
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
    return apiError("Original receipt file is not available for accurate scan.", 400);
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
      scanMode: "accurate",
      currencyHint: "EUR",
      categoryHints: categories.map((category) => category.name)
    });
    const suggestedCategory = categories.find(
      (category) => category.name === result.receipt.suggested_category
    );
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
        ai_confidence: result.receipt.confidence,
        ai_raw_response: result.rawResponse,
        ai_normalized_response: result.receipt,
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
          notes: "Updated from accurate receipt scan. Review before reporting.",
          items: result.receipt.items
        })
        .eq("id", receipt.expense_entry_id)
        .eq("user_id", userId);
    }

    await db
      .from("source_documents")
      .update({ status: "processed", error_message: null })
      .eq("id", sourceDocument.id)
      .eq("user_id", userId);
    await recordUsage(db, userId, {
      provider: result.provider,
      model: result.model,
      receiptId: receipt.id,
      sourceDocumentId: sourceDocument.id
    });

    return NextResponse.json({ data: { receiptId: receipt.id } });
  } catch (error) {
    const message = getErrorMessage(error);
    await markFailure({
      db,
      receiptId: receipt.id,
      sourceDocumentId: sourceDocument.id,
      userId,
      message
    });

    return apiError(
      "Could not run accurate receipt scan. Add the expense manually or try again.",
      500
    );
  }
}
