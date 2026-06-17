import { NextResponse } from "next/server";
import { getReceiptParser } from "@/lib/ai";
import {
  calculateCandidateReportableAmount,
  normalizeAllocationPercentage
} from "@/lib/calculations/allocation";
import { createClient } from "@/lib/supabase/server";
import { parseReceiptSchema } from "@/lib/validation/receipts";
import { apiError, parseJsonBody } from "@/server/reporting/api";
import type { SupabaseReportingClient } from "@/server/reporting/db";
import { getCategories, getCurrentUserId } from "@/server/reporting/queries";
import type {
  ExpenseEntryRow,
  ReceiptRow,
  SourceDocumentRow
} from "@/server/reporting/types";

export async function POST(request: Request) {
  const userId = await getCurrentUserId();

  if (!userId) return apiError("Authentication required.", 401);

  const parsed = await parseJsonBody(request, parseReceiptSchema);

  if (parsed.error || !parsed.data) return apiError(parsed.error ?? "Invalid receipt.");

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

  await db
    .from("source_documents")
    .update({ status: "processing", error_message: null })
    .eq("id", documentRow.id)
    .eq("user_id", userId);

  const download = await supabase.storage
    .from("receipt-originals")
    .download(documentRow.original_file_path);

  if (download.error || !download.data) {
    await db
      .from("source_documents")
      .update({ status: "failed", error_message: download.error?.message })
      .eq("id", documentRow.id)
      .eq("user_id", userId);

    return apiError(download.error?.message ?? "Receipt file was not uploaded.", 400);
  }

  const fileBuffer = Buffer.from(await download.data.arrayBuffer());
  const categories = await getCategories();
  const parser = getReceiptParser();
  const result = await parser({
    fileBuffer,
    mimeType: documentRow.mime_type ?? "application/octet-stream",
    fileName: documentRow.original_file_name ?? undefined,
    scanMode: parsed.data.scanMode ?? "fast",
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
    return apiError(receiptError?.message ?? "Could not create receipt.", 500);
  }

  const receipt = receiptData as ReceiptRow;
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
    return apiError(expenseError?.message ?? "Could not create expense draft.", 500);
  }

  const expense = expenseData as ExpenseEntryRow;
  await db
    .from("receipts")
    .update({ expense_entry_id: expense.id })
    .eq("id", receipt.id)
    .eq("user_id", userId);
  await db
    .from("source_documents")
    .update({ status: "processed", error_message: null })
    .eq("id", documentRow.id)
    .eq("user_id", userId);

  return NextResponse.json({ data: { receiptId: receipt.id, expenseId: expense.id } });
}
