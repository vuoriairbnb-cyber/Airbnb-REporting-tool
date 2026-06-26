import { NextResponse } from "next/server";
import {
  calculateCandidateReportableAmount,
  normalizeAllocationPercentage
} from "@/lib/calculations/allocation";
import { createClient } from "@/lib/supabase/server";
import { expenseInputSchema } from "@/lib/validation/expenses";
import { apiError, logServerError, parseJsonBody } from "@/server/reporting/api";
import type { SupabaseReportingClient } from "@/server/reporting/db";
import { assertExpenseRelations, isOwnershipError } from "@/server/reporting/ownership";
import { getCurrentUserId } from "@/server/reporting/queries";

export async function GET() {
  const userId = await getCurrentUserId();

  if (!userId) return apiError("Authentication required.", 401);

  const supabase = (await createClient()) as unknown as SupabaseReportingClient;
  const { data, error } = await supabase
    .from("expense_entries")
    .select("*, properties(name), categories(name)")
    .eq("user_id", userId)
    .order("date", { ascending: false, nullsFirst: false });

  if (error) {
    logServerError("expenses.list", error);
    return apiError("Could not load expenses.", 500);
  }

  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const userId = await getCurrentUserId();

  if (!userId) return apiError("Authentication required.", 401);

  const parsed = await parseJsonBody(request, expenseInputSchema);

  if (parsed.error || !parsed.data) return apiError(parsed.error ?? "Invalid expense.");

  try {
    await assertExpenseRelations(userId, parsed.data);
  } catch (error) {
    if (isOwnershipError(error)) return apiError(error.message, error.status);
    logServerError("expenses.create.ownership", error);
    return apiError("Could not verify expense ownership.", 500);
  }

  const allocationPercentage = normalizeAllocationPercentage(
    parsed.data.allocation_method,
    parsed.data.allocation_percentage
  );
  const candidateReportableAmount = calculateCandidateReportableAmount(
    parsed.data.total_amount,
    allocationPercentage
  );
  const status = parsed.data.allocation_method === "excluded" ? "excluded" : "reviewed";

  const supabase = (await createClient()) as unknown as SupabaseReportingClient;
  const { data, error } = await supabase
    .from("expense_entries")
    .insert({
      ...parsed.data,
      user_id: userId,
      allocation_percentage: allocationPercentage,
      candidate_reportable_amount: candidateReportableAmount,
      status
    })
    .select("*")
    .single();

  if (error) {
    logServerError("expenses.create", error);
    return apiError("Could not create expense.", 500);
  }

  return NextResponse.json({ data }, { status: 201 });
}
