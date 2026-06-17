import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createSourceDocumentSchema } from "@/lib/validation/receipts";
import { apiError, parseJsonBody } from "@/server/reporting/api";
import type { SupabaseReportingClient } from "@/server/reporting/db";
import { getCurrentUserId } from "@/server/reporting/queries";
import type { SourceDocumentRow } from "@/server/reporting/types";

function sanitizeFileName(fileName: string) {
  return fileName
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 180);
}

export async function POST(request: Request) {
  const userId = await getCurrentUserId();

  if (!userId) return apiError("Authentication required.", 401);

  const parsed = await parseJsonBody(request, createSourceDocumentSchema);

  if (parsed.error || !parsed.data) {
    return apiError(parsed.error ?? "Invalid source document.");
  }

  const supabase = (await createClient()) as unknown as SupabaseReportingClient;

  if (parsed.data.propertyId) {
    const { data: property, error: propertyError } = await supabase
      .from("properties")
      .select("id")
      .eq("id", parsed.data.propertyId)
      .eq("user_id", userId)
      .single();

    if (propertyError || !property) return apiError("Property not found.", 404);
  }

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

  if (error) return apiError(error.message, 500);

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
