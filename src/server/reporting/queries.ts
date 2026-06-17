import { createClient } from "@/lib/supabase/server";
import type { SupabaseReportingClient } from "@/server/reporting/db";
import type {
  CategoryRow,
  DashboardSummary,
  ExpenseEntryRow,
  IncomeEntryRow,
  PropertyRow,
  ReceiptRow,
  ReportingFilters
} from "@/server/reporting/types";

function getCurrentYearRange() {
  const year = new Date().getFullYear();

  return {
    dateFrom: `${year}-01-01`,
    dateTo: `${year}-12-31`
  };
}

export async function getCurrentUserId() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  return user?.id ?? null;
}

export async function getProperties() {
  const supabase = (await createClient()) as unknown as SupabaseReportingClient;
  const userId = await getCurrentUserId();

  if (!userId) return [] as PropertyRow[];

  const { data, error } = await supabase
    .from("properties")
    .select("*")
    .eq("user_id", userId)
    .order("is_active", { ascending: false })
    .order("name", { ascending: true });

  if (error) throw error;

  return (data ?? []) as PropertyRow[];
}

export async function getCategories() {
  const supabase = (await createClient()) as unknown as SupabaseReportingClient;
  const { data, error } = await supabase
    .from("categories")
    .select("id,user_id,name,sort_order,is_default,is_active")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) throw error;

  return (data ?? []) as CategoryRow[];
}

export async function getIncomeEntries(filters: ReportingFilters = {}) {
  const supabase = (await createClient()) as unknown as SupabaseReportingClient;
  const userId = await getCurrentUserId();

  if (!userId) return [] as IncomeEntryRow[];

  let query = supabase
    .from("income_entries")
    .select("*, properties(name)")
    .eq("user_id", userId)
    .order("date", { ascending: false });

  if (filters.dateFrom) query = query.gte("date", filters.dateFrom);
  if (filters.dateTo) query = query.lte("date", filters.dateTo);
  if (filters.propertyId) query = query.eq("property_id", filters.propertyId);

  const { data, error } = await query;

  if (error) throw error;

  return (data ?? []) as IncomeEntryRow[];
}

export async function getIncomeEntry(id: string) {
  const supabase = (await createClient()) as unknown as SupabaseReportingClient;
  const userId = await getCurrentUserId();

  if (!userId) return null;

  const { data, error } = await supabase
    .from("income_entries")
    .select("*, properties(name)")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (error) return null;

  return data as IncomeEntryRow;
}

export async function getExpenseEntries(filters: ReportingFilters = {}) {
  const supabase = (await createClient()) as unknown as SupabaseReportingClient;
  const userId = await getCurrentUserId();

  if (!userId) return [] as ExpenseEntryRow[];

  let query = supabase
    .from("expense_entries")
    .select("*, properties(name), categories(name)")
    .eq("user_id", userId)
    .order("date", { ascending: false, nullsFirst: false });

  if (filters.dateFrom) query = query.gte("date", filters.dateFrom);
  if (filters.dateTo) query = query.lte("date", filters.dateTo);
  if (filters.propertyId) query = query.eq("property_id", filters.propertyId);
  if (filters.categoryId) query = query.eq("category_id", filters.categoryId);
  if (filters.status) query = query.eq("status", filters.status);

  const { data, error } = await query;

  if (error) throw error;

  return (data ?? []) as ExpenseEntryRow[];
}

export async function getProperty(id: string) {
  const supabase = (await createClient()) as unknown as SupabaseReportingClient;
  const userId = await getCurrentUserId();

  if (!userId) return null;

  const { data, error } = await supabase
    .from("properties")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (error) return null;

  return data as PropertyRow;
}

export async function getExpenseEntry(id: string) {
  const supabase = (await createClient()) as unknown as SupabaseReportingClient;
  const userId = await getCurrentUserId();

  if (!userId) return null;

  const { data, error } = await supabase
    .from("expense_entries")
    .select("*, properties(name), categories(name)")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (error) return null;

  return data as ExpenseEntryRow;
}

export async function getReceipts() {
  const supabase = (await createClient()) as unknown as SupabaseReportingClient;
  const userId = await getCurrentUserId();

  if (!userId) return [] as ReceiptRow[];

  const { data, error } = await supabase
    .from("receipts")
    .select("*, source_documents(*, properties(name)), expense_entries(*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []) as ReceiptRow[];
}

export async function getReceipt(id: string) {
  const supabase = (await createClient()) as unknown as SupabaseReportingClient;
  const userId = await getCurrentUserId();

  if (!userId) return null;

  const { data, error } = await supabase
    .from("receipts")
    .select("*, source_documents(*, properties(name)), expense_entries(*)")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (error) return null;

  return data as ReceiptRow;
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const range = getCurrentYearRange();
  const [incomeEntries, expenseEntries] = await Promise.all([
    getIncomeEntries(range),
    getExpenseEntries(range)
  ]);

  const rentalIncomeThisYear = incomeEntries.reduce(
    (sum, entry) => sum + Number(entry.net_payout ?? entry.gross_amount ?? 0),
    0
  );
  const activeExpenses = expenseEntries.filter((entry) => entry.status !== "archived");
  const expensesThisYear = activeExpenses.reduce(
    (sum, entry) => sum + Number(entry.total_amount ?? 0),
    0
  );
  const candidateReportableExpenses = activeExpenses.reduce(
    (sum, entry) => sum + Number(entry.candidate_reportable_amount ?? 0),
    0
  );
  const expensesMissingAllocation = activeExpenses.filter(
    (entry) =>
      entry.allocation_method === "manual_percentage" &&
      (entry.allocation_percentage === null || entry.allocation_percentage === undefined)
  ).length;

  return {
    rentalIncomeThisYear,
    expensesThisYear,
    candidateReportableExpenses,
    estimatedRentalResult: rentalIncomeThisYear - candidateReportableExpenses,
    expensesMissingAllocation
  };
}
