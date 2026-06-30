import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createSourceDocumentSchema } from "@/lib/validation/receipts";
import { apiError, logServerError, parseJsonBody } from "@/server/reporting/api";
import { requireApprovedUserIdForApi } from "@/server/reporting/approval";
import type { SupabaseReportingClient } from "@/server/reporting/db";
import { assertUserOwnsProperty, isOwnershipError } from "@/server/reporting/ownership";
import type { SourceDocumentRow } from "@/server/reporting/types";

function sanitizeFileName(fileName: string) {
  return fileName
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 180);
}

const markSourceDocumentFailedSchema = z.object({
  sourceDocumentId: z.string().uuid(),
  errorMessage: z.string().trim().min(1).max(500).optional()
});

export async function POST(request: Request) {
  const approval = await requireApprovedUserIdForApi();

  if (approval.response) return approval.response;

  const userId = approval.userId;

  const parsed = await parseJsonBody(request, createSourceDocumentSchema);

  if (parsed.error || !parsed.data) {
    return apiError(parsed.error ?? "Invalid source document.");
  }

  try {
    await assertUserOwnsProperty(userId, parsed.data.propertyId);
  } catch (error) {
    if (isOwnershipError(error)) return apiError(error.message, error.status);
    logServerError("uploads.create.ownership", error);
    return apiError("Could not verify upload ownership.", 500);
  }

  const supabase = (await createClient()) as unknown as SupabaseReportingClient;
  const sourceDocumentId = crypto.randomUUID();
  const uploadPath = `${userId}/${sourceDocumentId}/${sanitizeFileName(
    parsed.data.fileName
  )}`;

  const { data, error } = await supabase
    .from("source_documents")
    .insert({
      id: sourceDocumentId,
      user_id: userId,
      property_id: parsed.data.propertyId ?? null,
      original_file_path: uploadPath,
      original_file_name: parsed.data.fileName,
      mime_type: parsed.data.mimeType,
      file_size_bytes: parsed.data.fileSizeBytes,
      status: "uploaded"
    })
    .select("id,original_file_path")
    .single();

  if (error) {
    logServerError("uploads.create", error);
    return apiError("Could not create source document.", 500);
  }

  const sourceDocument = data as Pick<SourceDocumentRow, "id" | "original_file_path">;

  return NextResponse.json(
    {
      data: {
        sourceDocumentId: sourceDocument?.id ?? sourceDocumentId,
        uploadPath: sourceDocument?.original_file_path ?? uploadPath,
        bucket: "receipt-originals"
      }
    },
    { status: 201 }
  );
}

export async function PATCH(request: Request) {
  const approval = await requireApprovedUserIdForApi();

  if (approval.response) return approval.response;

  const userId = approval.userId;

  const parsed = await parseJsonBody(request, markSourceDocumentFailedSchema);

  if (parsed.error || !parsed.data) {
    return apiError(parsed.error ?? "Invalid source document update.");
  }

  const supabase = (await createClient()) as unknown as SupabaseReportingClient;
  const { data, error } = await supabase
    .from("source_documents")
    .update({
      status: "failed",
      error_message: parsed.data.errorMessage ?? "Receipt upload failed."
    })
    .eq("id", parsed.data.sourceDocumentId)
    .eq("user_id", userId)
    .select("id")
    .single();

  if (error || !data) return apiError("Source document not found.", 404);

  const sourceDocument = data as Pick<SourceDocumentRow, "id">;

  return NextResponse.json({ data: { sourceDocumentId: sourceDocument.id } });
}
