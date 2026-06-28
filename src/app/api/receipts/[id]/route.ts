import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiError, logServerError } from "@/server/reporting/api";
import type { SupabaseReportingClient } from "@/server/reporting/db";
import { getCurrentUserId, getReceipt } from "@/server/reporting/queries";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getCurrentUserId();

  if (!userId) return apiError("Authentication required.", 401);

  const { id } = await params;
  const receipt = await getReceipt(id);

  if (!receipt) return apiError("Receipt not found.", 404);

  return NextResponse.json({ data: receipt });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getCurrentUserId();

  if (!userId) return apiError("Authentication required.", 401);

  const { id } = await params;
  const supabaseClient = await createClient();
  const supabase = supabaseClient as unknown as SupabaseReportingClient;
  const { data: receiptData, error: receiptError } = await supabase
    .from("receipts")
    .select(
      "id,source_document_id,expense_entry_id,original_file_path,image_path,preview_image_path,crop_image_path,source_documents(id,original_file_path)"
    )
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (receiptError || !receiptData) return apiError("Receipt not found.", 404);

  const receipt = receiptData as {
    id: string;
    source_document_id?: string | null;
    expense_entry_id?: string | null;
    original_file_path?: string | null;
    image_path?: string | null;
    preview_image_path?: string | null;
    crop_image_path?: string | null;
    source_documents?: { id: string; original_file_path?: string | null } | null;
  };

  const originalPaths = Array.from(
    new Set(
      [receipt.original_file_path, receipt.source_documents?.original_file_path].filter(
        (path): path is string => Boolean(path)
      )
    )
  );
  const previewPaths = Array.from(
    new Set(
      [receipt.image_path, receipt.preview_image_path, receipt.crop_image_path].filter(
        (path): path is string => Boolean(path)
      )
    )
  );

  if (originalPaths.length) {
    const { error } = await supabaseClient.storage
      .from("receipt-originals")
      .remove(originalPaths);

    if (error) {
      logServerError("receipts.delete.storage_originals", error);
      return apiError("Could not delete receipt files from storage.", 500);
    }
  }

  if (previewPaths.length) {
    const { error } = await supabaseClient.storage
      .from("receipt-previews")
      .remove(previewPaths);

    if (error) {
      logServerError("receipts.delete.storage_previews", error);
      return apiError("Could not delete receipt preview files from storage.", 500);
    }
  }

  if (receipt.expense_entry_id) {
    const { error: deleteExpenseError } = await supabase
      .from("expense_entries")
      .delete()
      .eq("id", receipt.expense_entry_id)
      .eq("user_id", userId);

    if (deleteExpenseError) {
      logServerError("receipts.delete.expense", deleteExpenseError);
      return apiError("Could not delete the receipt-linked expense.", 500);
    }
  }

  const { error: deleteReceiptError } = await supabase
    .from("receipts")
    .delete()
    .eq("id", receipt.id)
    .eq("user_id", userId);

  if (deleteReceiptError) {
    logServerError("receipts.delete", deleteReceiptError);
    return apiError("Could not delete receipt.", 500);
  }

  if (receipt.source_document_id) {
    const { error: deleteSourceDocumentError } = await supabase
      .from("source_documents")
      .delete()
      .eq("id", receipt.source_document_id)
      .eq("user_id", userId);

    if (deleteSourceDocumentError) {
      logServerError("receipts.delete.source_document", deleteSourceDocumentError);
      return apiError(
        "Receipt was deleted, but its source document was not deleted.",
        500
      );
    }
  }

  return NextResponse.json({ data: { id: receipt.id, status: "deleted" } });
}
