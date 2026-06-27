import { NextResponse } from "next/server";
import { getAiProviderName, getReceiptParser } from "@/lib/ai";
import type { AiScanMode } from "@/lib/ai/types";
import {
  calculateCandidateReportableAmount,
  normalizeAllocationPercentage
} from "@/lib/calculations/allocation";
import { canRunAiScan } from "@/lib/stripe/entitlements";
import { createClient } from "@/lib/supabase/server";
import { parseReceiptSchema } from "@/lib/validation/receipts";
import { apiError, logServerError, parseJsonBody } from "@/server/reporting/api";
import type { SupabaseReportingClient } from "@/server/reporting/db";
import { getCategories, getCurrentUserId } from "@/server/reporting/queries";
import type {
  ExpenseEntryRow,
  ReceiptRow,
  SourceDocumentRow
} from "@/server/reporting/types";

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;

  return "Receipt parsing failed.";
}

async function markSourceDocumentFailed(
  db: SupabaseReportingClient,
  sourceDocumentId: string,
  userId: string,
  errorMessage: string
) {
  await db
    .from("source_documents")
    .update({ status: "failed", error_message: errorMessage })
    .eq("id", sourceDocumentId)
    .eq("user_id", userId);
}

async function markReceiptFailed(
  db: SupabaseReportingClient,
  receiptId: string,
  userId: string,
  errorMessage: string
) {
  await db
    .from("receipts")
    .update({ status: "failed", ai_error_message: errorMessage })
    .eq("id", receiptId)
    .eq("user_id", userId);
}

async function recordAiUsage(
  db: SupabaseReportingClient,
  userId: string,
  eventType: `ai_scan_${AiScanMode}`,
  metadata: Record<string, unknown>
) {
  await db.from("usage_events").insert({
    user_id: userId,
    event_type: eventType,
    metadata
  });
}

export async function POST(request: Request) {
  const userId = await getCurrentUserId();

  if (!userId) return apiError("Authentication required.", 401);

  const parsed = await parseJsonBody(request, parseReceiptSchema);

  if (parsed.error || !parsed.data) return apiError(parsed.error ?? "Invalid receipt.");

  const scanMode = parsed.data.scanMode as AiScanMode;
  const scanAccess = await canRunAiScan(userId, scanMode);

  if (!scanAccess.allowed) {
    return apiError(scanAccess.reason ?? "Receipt scan is not available.", 403);
  }

  const supabase = await createClient();
  const db = supabase as unknown as SupabaseReportingClient;
  const { data: sourceDocument, error: sourceDocumentError } = await db
    .from("source_documents")
    .select("*")
    .eq("id", parsed.data.sourceDocumentId)
    .eq("user_id", userId)
    .single();

  if (sourceDocumentError || !sourceDocument) {
    return apiError("Source document not found.", 404);
  }

  const documentRow = sourceDocument as SourceDocumentRow;
  const aiProviderName = getAiProviderName();

  if (aiProviderName !== "mock") {
    const { data: profile, error: profileError } = await db
      .from("profiles")
      .select("ai_processing_consent_at")
      .eq("id", userId)
      .single();

    const hasAiConsent = Boolean(
      (profile as { ai_processing_consent_at?: string | null } | null)
        ?.ai_processing_consent_at
    );

    if (profileError || !hasAiConsent) {
      return apiError("AI processing consent is required before parsing receipts.", 403);
    }
  }

  await db
    .from("source_documents")
    .update({ status: "processing", error_message: null })
    .eq("id", documentRow.id)
    .eq("user_id", userId);

  const download = await supabase.storage
    .from("receipt-originals")
    .download(documentRow.original_file_path);

  if (download.error || !download.data) {
    await markSourceDocumentFailed(
      db,
      documentRow.id,
      userId,
      download.error?.message ?? "Receipt file was not uploaded."
    );

    logServerError("ai.parse.storage", download.error);
    return apiError("Receipt file was not uploaded or could not be read.", 400);
  }

  let receipt: ReceiptRow | null = null;

  try {
    const fileBuffer = Buffer.from(await download.data.arrayBuffer());
    const categories = await getCategories();
    const parser = getReceiptParser();
    const result = await parser({
      fileBuffer,
      mimeType: documentRow.mime_type ?? "application/octet-stream",
      fileName: documentRow.original_file_name ?? undefined,
      scanMode,
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

    const { data: receiptData, error: receiptError } = await db
      .from("receipts")
      .insert({
        user_id: userId,
        source_document_id: documentRow.id,
        status: "needs_review",
        original_file_path: documentRow.original_file_path,
        ai_provider: result.provider,
        ai_model: result.model,
        ai_scan_mode: result.scanMode,
        ai_confidence: result.receipt.confidence,
        ai_raw_response: result.rawResponse,
        ai_normalized_response: result.receipt
      })
      .select("*")
      .single();

    if (receiptError || !receiptData) {
      const message = receiptError?.message ?? "Could not create receipt.";
      await markSourceDocumentFailed(db, documentRow.id, userId, message);

      logServerError("ai.parse.receipt_create", receiptError);
      return apiError("Could not create receipt review.", 500);
    }

    receipt = receiptData as ReceiptRow;
    const { data: expenseData, error: expenseError } = await db
      .from("expense_entries")
      .insert({
        user_id: userId,
        property_id: documentRow.property_id,
        receipt_id: receipt.id,
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
        notes: "Created from mock receipt extraction. Review before reporting.",
        items: result.receipt.items
      })
      .select("*")
      .single();

    if (expenseError || !expenseData) {
      const message = expenseError?.message ?? "Could not create expense draft.";
      await markReceiptFailed(db, receipt.id, userId, message);
      await markSourceDocumentFailed(db, documentRow.id, userId, message);

      return apiError(
        "Receipt was parsed, but the expense draft could not be created. Add the expense manually or try another receipt.",
        500
      );
    }

    const expense = expenseData as ExpenseEntryRow;
    const { error: linkError } = await db
      .from("receipts")
      .update({ expense_entry_id: expense.id })
      .eq("id", receipt.id)
      .eq("user_id", userId);

    if (linkError) {
      await markReceiptFailed(db, receipt.id, userId, linkError.message);
      await markSourceDocumentFailed(db, documentRow.id, userId, linkError.message);

      return apiError(
        "Receipt was parsed, but it could not be linked to the expense draft. Add the expense manually or try another receipt.",
        500
      );
    }

    await db
      .from("source_documents")
      .update({ status: "processed", error_message: null })
      .eq("id", documentRow.id)
      .eq("user_id", userId);

    await recordAiUsage(db, userId, `ai_scan_${result.scanMode}`, {
      provider: result.provider,
      model: result.model,
      sourceDocumentId: documentRow.id,
      receiptId: receipt.id,
      expenseId: expense.id
    });

    return NextResponse.json({ data: { receiptId: receipt.id, expenseId: expense.id } });
  } catch (error) {
    const message = getErrorMessage(error);
    logServerError(`ai.parse.provider.${aiProviderName}.${scanMode}`, error);

    if (receipt?.id) {
      await markReceiptFailed(db, receipt.id, userId, message);
    }

    await markSourceDocumentFailed(db, documentRow.id, userId, message);

    return apiError("Unable to parse receipt with AI.", 500);
  }
}
