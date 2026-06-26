import { NextResponse } from "next/server";
import { canGenerateReport } from "@/lib/stripe/entitlements";
import { createClient } from "@/lib/supabase/server";
import { createReportSchema } from "@/lib/validation/reports";
import { apiError, logServerError, parseJsonBody } from "@/server/reporting/api";
import { assertReportFilters, isOwnershipError } from "@/server/reporting/ownership";
import {
  generateReportArtifact,
  getReportDataset,
  uploadGeneratedReport
} from "@/server/reporting/report-generation";
import { getCurrentUserId } from "@/server/reporting/queries";
import type { SupabaseReportingClient } from "@/server/reporting/db";
import type { ReportRow } from "@/server/reporting/types";

export async function POST(request: Request) {
  const userId = await getCurrentUserId();

  if (!userId) return apiError("Authentication required.", 401);

  const parsed = await parseJsonBody(request, createReportSchema);

  if (parsed.error || !parsed.data) {
    return apiError(parsed.error ?? "Invalid report request.");
  }

  const supabase = await createClient();
  const db = supabase as unknown as SupabaseReportingClient;
  const { data: profile, error: profileError } = await db
    .from("profiles")
    .select("disclaimer_accepted_at")
    .eq("id", userId)
    .single();

  const disclaimerAcceptedAt = (
    profile as { disclaimer_accepted_at?: string | null } | null
  )?.disclaimer_accepted_at;

  if (profileError || !disclaimerAcceptedAt) {
    return apiError("Disclaimer acceptance is required before generating reports.", 403);
  }

  const reportAccess = await canGenerateReport(userId, parsed.data.type);

  if (!reportAccess.allowed) {
    return apiError(reportAccess.reason ?? "Report generation is not available.", 403);
  }

  const filters = {
    date_from: parsed.data.date_from,
    date_to: parsed.data.date_to,
    property_id: parsed.data.property_id ?? null,
    category_id: parsed.data.category_id ?? null
  };

  try {
    await assertReportFilters(userId, parsed.data);
  } catch (error) {
    if (isOwnershipError(error)) return apiError(error.message, error.status);
    logServerError("reports.create.ownership", error);
    return apiError("Could not verify report filters.", 500);
  }

  const { data: reportData, error: reportInsertError } = await db
    .from("reports")
    .insert({
      user_id: userId,
      type: parsed.data.type,
      status: "processing",
      property_id: parsed.data.property_id ?? null,
      date_from: parsed.data.date_from,
      date_to: parsed.data.date_to,
      filters
    })
    .select("*")
    .single();

  if (reportInsertError || !reportData) {
    logServerError("reports.create.insert", reportInsertError);
    return apiError("Could not create report record.", 500);
  }

  const report = reportData as ReportRow;

  try {
    const dataset = await getReportDataset(userId, {
      dateFrom: parsed.data.date_from,
      dateTo: parsed.data.date_to,
      propertyId: parsed.data.property_id ?? null,
      categoryId: parsed.data.category_id ?? null
    });
    const artifact = await generateReportArtifact(parsed.data.type, dataset, {
      dateFrom: parsed.data.date_from,
      dateTo: parsed.data.date_to,
      propertyId: parsed.data.property_id ?? null,
      categoryId: parsed.data.category_id ?? null
    });
    const upload = await uploadGeneratedReport({
      userId,
      reportId: report.id,
      artifact
    });

    const { error: updateError } = await db
      .from("reports")
      .update({
        status: "ready",
        file_path: upload.filePath,
        file_name: upload.fileName,
        mime_type: upload.mimeType,
        file_size_bytes: upload.fileSizeBytes,
        error_message: null
      })
      .eq("id", report.id)
      .eq("user_id", userId);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({
      data: {
        reportId: report.id,
        status: "ready"
      }
    });
  } catch (error) {
    const errorMessage = "Could not generate report.";
    logServerError("reports.create.generate", error);

    await db
      .from("reports")
      .update({ status: "failed", error_message: errorMessage })
      .eq("id", report.id)
      .eq("user_id", userId);

    return apiError(errorMessage, 500);
  }
}
