import { NextResponse } from "next/server";
import { apiError, logServerError } from "@/server/reporting/api";
import { createReportDownloadUrl } from "@/server/reporting/report-generation";
import { getCurrentUserId, getReport } from "@/server/reporting/queries";

export async function GET(
  _request: Request,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  const userId = await getCurrentUserId();

  if (!userId) return apiError("Authentication required.", 401);

  const { id } = await context.params;
  const report = await getReport(id);

  if (!report) return apiError("Report not found.", 404);

  if (report.status !== "ready") {
    return NextResponse.json({
      data: {
        id: report.id,
        status: report.status,
        error: report.error_message
      }
    });
  }

  try {
    const signedUrl = await createReportDownloadUrl(report);

    return NextResponse.json({
      data: {
        id: report.id,
        status: report.status,
        fileName: report.file_name,
        mimeType: report.mime_type,
        downloadUrl: signedUrl
      }
    });
  } catch (error) {
    logServerError("reports.download_url", error);
    return apiError("Could not create report download URL.", 500);
  }
}
