import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { incomeInputSchema } from "@/lib/validation/income";
import { apiError, logServerError, parseJsonBody } from "@/server/reporting/api";
import type { SupabaseReportingClient } from "@/server/reporting/db";
import { assertIncomeRelations, isOwnershipError } from "@/server/reporting/ownership";
import { getCurrentUserId } from "@/server/reporting/queries";

type Context = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: Context) {
  const userId = await getCurrentUserId();
  const { id } = await context.params;

  if (!userId) return apiError("Authentication required.", 401);

  const supabase = (await createClient()) as unknown as SupabaseReportingClient;
  const { data, error } = await supabase
    .from("income_entries")
    .select("*, properties(name)")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (error) return apiError("Income entry not found.", 404);

  return NextResponse.json({ data });
}

export async function PATCH(request: Request, context: Context) {
  const userId = await getCurrentUserId();
  const { id } = await context.params;

  if (!userId) return apiError("Authentication required.", 401);

  const parsed = await parseJsonBody(request, incomeInputSchema.partial());

  if (parsed.error || !parsed.data) return apiError(parsed.error ?? "Invalid income.");

  try {
    await assertIncomeRelations(userId, parsed.data);
  } catch (error) {
    if (isOwnershipError(error)) return apiError(error.message, error.status);
    logServerError("income.update.ownership", error);
    return apiError("Could not verify income entry ownership.", 500);
  }

  const supabase = (await createClient()) as unknown as SupabaseReportingClient;
  const { data, error } = await supabase
    .from("income_entries")
    .update(parsed.data)
    .eq("id", id)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error) {
    logServerError("income.update", error);
    return apiError("Could not update income entry.", 500);
  }

  return NextResponse.json({ data });
}

export async function DELETE(_request: Request, context: Context) {
  const userId = await getCurrentUserId();
  const { id } = await context.params;

  if (!userId) return apiError("Authentication required.", 401);

  const supabase = (await createClient()) as unknown as SupabaseReportingClient;
  const { error } = await supabase
    .from("income_entries")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    logServerError("income.delete", error);
    return apiError("Could not delete income entry.", 500);
  }

  return NextResponse.json({ data: { id } });
}
