import { NextResponse } from "next/server";
import {
  calculateCandidateReportableAmount,
  normalizeAllocationPercentage,
  type AllocationMethod
} from "@/lib/calculations/allocation";
import { createClient } from "@/lib/supabase/server";
import { expenseInputSchema } from "@/lib/validation/expenses";
import { apiError, parseJsonBody } from "@/server/reporting/api";
import type { SupabaseReportingClient } from "@/server/reporting/db";
import { getCurrentUserId } from "@/server/reporting/queries";

type Context = {
  params: Promise<{ id: string }>;
};

type CurrentExpenseAllocation = {
  total_amount: number | null;
  allocation_percentage: number | null;
  allocation_method: string;
};

export async function GET(_request: Request, context: Context) {
  const userId = await getCurrentUserId();
  const { id } = await context.params;

  if (!userId) return apiError("Authentication required.", 401);

  const supabase = (await createClient()) as unknown as SupabaseReportingClient;
  const { data, error } = await supabase
    .from("expense_entries")
    .select("*, properties(name), categories(name)")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (error) return apiError(error.message, 404);

  return NextResponse.json({ data });
}

export async function PATCH(request: Request, context: Context) {
  const userId = await getCurrentUserId();
  const { id } = await context.params;

  if (!userId) return apiError("Authentication required.", 401);

  const parsed = await parseJsonBody(request, expenseInputSchema.partial());

  if (parsed.error || !parsed.data) return apiError(parsed.error ?? "Invalid expense.");

  const update: Record<string, unknown> = { ...parsed.data };

  if (
    parsed.data.total_amount !== undefined ||
    parsed.data.allocation_percentage !== undefined ||
    parsed.data.allocation_method !== undefined
  ) {
    const supabase = (await createClient()) as unknown as SupabaseReportingClient;
    const { data: current, error: currentError } = await supabase
      .from("expense_entries")
      .select("total_amount, allocation_percentage, allocation_method")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (currentError) return apiError(currentError.message, 404);

    const currentExpense = current as CurrentExpenseAllocation;
    const totalAmount = Number(
      parsed.data.total_amount ?? currentExpense.total_amount ?? 0
    );
    const method = (parsed.data.allocation_method ??
      currentExpense.allocation_method) as AllocationMethod;
    const allocationPercentage = normalizeAllocationPercentage(
      method,
      Number(
        parsed.data.allocation_percentage ?? currentExpense.allocation_percentage ?? 100
      )
    );

    update.allocation_percentage = allocationPercentage;
    update.candidate_reportable_amount = calculateCandidateReportableAmount(
      totalAmount,
      allocationPercentage
    );
    update.status = method === "excluded" ? "excluded" : "reviewed";
  }

  const supabase = (await createClient()) as unknown as SupabaseReportingClient;
  const { data, error } = await supabase
    .from("expense_entries")
    .update(update)
    .eq("id", id)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error) return apiError(error.message, 500);

  return NextResponse.json({ data });
}

export async function DELETE(_request: Request, context: Context) {
  const userId = await getCurrentUserId();
  const { id } = await context.params;

  if (!userId) return apiError("Authentication required.", 401);

  const supabase = (await createClient()) as unknown as SupabaseReportingClient;
  const { data, error } = await supabase
    .from("expense_entries")
    .update({ status: "archived" })
    .eq("id", id)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error) return apiError(error.message, 500);

  return NextResponse.json({ data });
}
