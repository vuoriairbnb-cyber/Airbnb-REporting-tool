import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { incomeInputSchema } from "@/lib/validation/income";
import { apiError, logServerError, parseJsonBody } from "@/server/reporting/api";
import { requireApprovedUserIdForApi } from "@/server/reporting/approval";
import type { SupabaseReportingClient } from "@/server/reporting/db";
import { assertIncomeRelations, isOwnershipError } from "@/server/reporting/ownership";
import { getCurrentUserId } from "@/server/reporting/queries";

export async function GET() {
  const userId = await getCurrentUserId();

  if (!userId) return apiError("Authentication required.", 401);

  const supabase = (await createClient()) as unknown as SupabaseReportingClient;
  const { data, error } = await supabase
    .from("income_entries")
    .select("*, properties(name)")
    .eq("user_id", userId)
    .order("date", { ascending: false });

  if (error) {
    logServerError("income.list", error);
    return apiError("Could not load income entries.", 500);
  }

  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const approval = await requireApprovedUserIdForApi();

  if (approval.response) return approval.response;

  const userId = approval.userId;

  const parsed = await parseJsonBody(request, incomeInputSchema);

  if (parsed.error || !parsed.data) return apiError(parsed.error ?? "Invalid income.");

  try {
    await assertIncomeRelations(userId, parsed.data);
  } catch (error) {
    if (isOwnershipError(error)) return apiError(error.message, error.status);
    logServerError("income.create.ownership", error);
    return apiError("Could not verify income entry ownership.", 500);
  }

  const supabase = (await createClient()) as unknown as SupabaseReportingClient;
  const { data, error } = await supabase
    .from("income_entries")
    .insert({ ...parsed.data, user_id: userId })
    .select("*")
    .single();

  if (error) {
    logServerError("income.create", error);
    return apiError("Could not create income entry.", 500);
  }

  return NextResponse.json({ data }, { status: 201 });
}
