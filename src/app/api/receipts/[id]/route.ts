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
  const supabase = (await createClient()) as unknown as SupabaseReportingClient;
  const archivedAt = new Date().toISOString();
  const { data: receiptData, error: receiptError } = await supabase
    .from("receipts")
    .select("id,source_document_id")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (receiptError || !receiptData) return apiError("Receipt not found.", 404);

  const receipt = receiptData as {
    id: string;
    source_document_id?: string | null;
  };
  const { error: updateReceiptError } = await supabase
    .from("receipts")
    .update({ status: "archived", archived_at: archivedAt })
    .eq("id", receipt.id)
    .eq("user_id", userId);

  if (updateReceiptError) {
    logServerError("receipts.archive", updateReceiptError);
    return apiError("Could not archive receipt.", 500);
  }

  if (receipt.source_document_id) {
    const { error: updateSourceDocumentError } = await supabase
      .from("source_documents")
      .update({ archived_at: archivedAt })
      .eq("id", receipt.source_document_id)
      .eq("user_id", userId);

    if (updateSourceDocumentError) {
      logServerError("receipts.archive.source_document", updateSourceDocumentError);
      return apiError(
        "Receipt was archived, but its source document was not updated.",
        500
      );
    }
  }

  return NextResponse.json({ data: { id: receipt.id, status: "archived" } });
}
