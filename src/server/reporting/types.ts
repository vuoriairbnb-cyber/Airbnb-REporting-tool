export type PropertyRow = {
  id: string;
  user_id: string;
  name: string;
  address: string | null;
  city: string | null;
  country: string | null;
  currency: string;
  default_allocation_method: string | null;
  default_allocation_percentage: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type CategoryRow = {
  id: string;
  user_id: string | null;
  name: string;
  sort_order: number;
  is_default: boolean;
  is_active: boolean;
};

export type IncomeEntryRow = {
  id: string;
  user_id: string;
  property_id: string | null;
  date: string;
  platform: string;
  gross_amount: number | null;
  platform_fee: number | null;
  cleaning_fee: number | null;
  net_payout: number | null;
  currency: string;
  notes: string | null;
  properties?: Pick<PropertyRow, "name"> | null;
};

export type ExpenseStatus =
  | "draft"
  | "needs_review"
  | "reviewed"
  | "excluded"
  | "archived";

export type ExpenseEntryRow = {
  id: string;
  user_id: string;
  property_id: string | null;
  date: string | null;
  vendor: string | null;
  category_id: string | null;
  total_amount: number | null;
  tax_amount?: number | null;
  currency: string;
  allocation_method: string;
  allocation_percentage: number;
  candidate_reportable_amount: number | null;
  status: ExpenseStatus;
  notes: string | null;
  items?: unknown;
  properties?: Pick<PropertyRow, "name"> | null;
  categories?: Pick<CategoryRow, "name"> | null;
};

export type SourceDocumentStatus = "uploaded" | "processing" | "processed" | "failed";

export type SourceDocumentRow = {
  id: string;
  user_id: string;
  property_id: string | null;
  original_file_path: string;
  original_file_name: string | null;
  mime_type: string | null;
  file_size_bytes: number | null;
  page_count: number | null;
  status: SourceDocumentStatus;
  error_message: string | null;
  archived_at?: string | null;
  created_at: string;
  updated_at: string;
  properties?: Pick<PropertyRow, "name"> | null;
};

export type ReceiptStatus =
  | "uploaded"
  | "processing"
  | "needs_review"
  | "reviewed"
  | "failed"
  | "archived";

export type ReceiptRow = {
  id: string;
  user_id: string;
  source_document_id: string | null;
  expense_entry_id: string | null;
  status: ReceiptStatus;
  original_file_path: string | null;
  image_path: string | null;
  preview_image_path: string | null;
  crop_image_path: string | null;
  page_number: number | null;
  ai_provider: string | null;
  ai_model: string | null;
  ai_scan_mode: string | null;
  ai_confidence: number | null;
  ai_raw_response: unknown;
  ai_normalized_response: unknown;
  ai_error_message: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  archived_at?: string | null;
  created_at: string;
  updated_at: string;
  source_documents?: SourceDocumentRow | null;
  expense_entries?: ExpenseEntryRow | null;
};

export type DashboardSummary = {
  rentalIncomeThisYear: number;
  expensesThisYear: number;
  candidateReportableExpenses: number;
  estimatedRentalResult: number;
  expensesMissingAllocation: number;
};

export type ReportStatus = "pending" | "processing" | "ready" | "failed";

export type ReportType =
  | "income_csv"
  | "expense_csv"
  | "allocation_csv"
  | "tax_preparation_pdf"
  | "receipt_archive_zip"
  | "full_reporting_zip";

export type ReportRow = {
  id: string;
  user_id: string;
  type: ReportType;
  status: ReportStatus;
  property_id: string | null;
  date_from: string | null;
  date_to: string | null;
  file_path: string | null;
  file_name: string | null;
  mime_type: string | null;
  file_size_bytes: number | null;
  filters: Record<string, unknown> | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
  properties?: Pick<PropertyRow, "name"> | null;
};

export type SubscriptionStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "incomplete"
  | "incomplete_expired"
  | "unpaid"
  | "none";

export type SubscriptionPlan = "free" | "starter" | "pro";

export type SubscriptionRow = {
  id: string;
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_price_id: string | null;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
};

export type ReportingFilters = {
  dateFrom?: string;
  dateTo?: string;
  propertyId?: string;
  categoryId?: string;
  status?: string;
};
