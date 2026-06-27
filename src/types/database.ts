export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: Record<string, never>;
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      expense_status: "draft" | "needs_review" | "reviewed" | "excluded" | "archived";
      receipt_status:
        | "uploaded"
        | "processing"
        | "needs_review"
        | "reviewed"
        | "failed"
        | "archived";
      source_document_status: "uploaded" | "processing" | "processed" | "failed";
      report_status: "pending" | "processing" | "ready" | "failed";
      report_type:
        | "income_csv"
        | "expense_csv"
        | "allocation_csv"
        | "tax_preparation_pdf"
        | "receipt_archive_zip"
        | "full_reporting_zip";
      ai_scan_mode: "fast" | "accurate" | "standard" | "plus" | "pro";
      subscription_status:
        | "trialing"
        | "active"
        | "past_due"
        | "canceled"
        | "incomplete"
        | "incomplete_expired"
        | "unpaid"
        | "none";
    };
  };
};
