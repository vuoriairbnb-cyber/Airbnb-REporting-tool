"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { Pill } from "@/components/app/primitives";
import { useFeedback } from "@/components/feedback/FeedbackProvider";
import { FailureState } from "@/components/state/FailureState";
import { Button } from "@/components/ui/button";
import { parseApiError } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import type { ReportRow } from "@/server/reporting/types";

function formatReportType(type: ReportRow["type"]) {
  switch (type) {
    case "income_csv":
      return "Income CSV";
    case "expense_csv":
      return "Expense CSV";
    case "allocation_csv":
      return "Allocation CSV";
    case "tax_preparation_pdf":
      return "Tax-preparation PDF";
    case "receipt_archive_zip":
      return "Receipt archive ZIP";
    case "full_reporting_zip":
      return "Full reporting ZIP";
    default:
      return type;
  }
}

function statusTone(status: ReportRow["status"]) {
  switch (status) {
    case "ready":
      return "bg-success/15 text-success";
    case "failed":
      return "bg-destructive/10 text-destructive";
    case "processing":
      return "bg-primary/10 text-primary";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat("en-FI", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export function ReportList({ reports }: { reports: ReportRow[] }) {
  const feedback = useFeedback();
  const [pendingReportId, setPendingReportId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleDownload(reportId: string) {
    setPendingReportId(reportId);
    setError(null);

    try {
      const response = await fetch(`/api/reports/${reportId}`);

      if (!response.ok) {
        throw new Error(await parseApiError(response, "Could not load report download."));
      }

      const body = await response.json().catch(() => null);
      if (body?.data?.status !== "ready" || !body?.data?.downloadUrl) {
        throw new Error(body?.data?.error ?? "Report is not ready yet.");
      }

      feedback.success({ title: "Download opened." });
      window.open(body.data.downloadUrl, "_blank", "noopener,noreferrer");
    } catch (downloadError) {
      setError(
        downloadError instanceof Error
          ? downloadError.message
          : "Could not load report download."
      );
    } finally {
      setPendingReportId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-2xl border border-border">
        <div className="hidden grid-cols-[minmax(0,1.3fr)_120px_160px_140px] gap-3 bg-surface/70 px-4 py-3 text-xs font-medium uppercase tracking-normal text-muted-foreground md:grid">
          <span>Report</span>
          <span>Status</span>
          <span>Created</span>
          <span className="text-right">Download</span>
        </div>

        <div className="divide-y divide-border">
          {reports.map((report) => (
            <div
              key={report.id}
              className="grid gap-3 px-4 py-4 md:grid-cols-[minmax(0,1.3fr)_120px_160px_140px] md:items-center"
            >
              <div className="min-w-0">
                <p className="font-medium">{formatReportType(report.type)}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {report.file_name ?? "Processing file details"}{" "}
                  {report.properties?.name ? `- ${report.properties.name}` : ""}
                </p>
                {report.error_message ? (
                  <p className="mt-2 text-sm text-destructive">{report.error_message}</p>
                ) : null}
              </div>

              <div>
                <Pill tone={statusTone(report.status)}>{report.status}</Pill>
              </div>

              <div className="text-sm text-muted-foreground">
                {formatTimestamp(report.created_at)}
              </div>

              <div className="flex justify-start md:justify-end">
                <Button
                  variant="outline"
                  disabled={report.status !== "ready" || pendingReportId === report.id}
                  onClick={() => handleDownload(report.id)}
                  className={cn(report.status !== "ready" && "opacity-70")}
                >
                  {pendingReportId === report.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  {report.status === "ready" ? "Download" : "Pending"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {error ? (
        <FailureState
          variant="inline"
          title="Could not download report"
          description={error}
        />
      ) : null}
    </div>
  );
}
