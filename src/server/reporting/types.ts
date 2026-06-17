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
  currency: string;
  allocation_method: string;
  allocation_percentage: number;
  candidate_reportable_amount: number | null;
  status: ExpenseStatus;
  notes: string | null;
  properties?: Pick<PropertyRow, "name"> | null;
  categories?: Pick<CategoryRow, "name"> | null;
};

export type DashboardSummary = {
  rentalIncomeThisYear: number;
  expensesThisYear: number;
  candidateReportableExpenses: number;
  estimatedRentalResult: number;
  expensesMissingAllocation: number;
};

export type ReportingFilters = {
  dateFrom?: string;
  dateTo?: string;
  propertyId?: string;
  categoryId?: string;
  status?: string;
};
