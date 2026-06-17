import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { incomeInputSchema } from "@/lib/validation/income";
import { apiError, parseJsonBody } from "@/server/reporting/api";
import type { SupabaseReportingClient } from "@/server/reporting/db";
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

  if (error) return apiError(error.message, 500);

  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const userId = await getCurrentUserId();

  if (!userId) return apiError("Authentication required.", 401);

  const parsed = await parseJsonBody(request, incomeInputSchema);

  if (parsed.error || !parsed.data) return apiError(parsed.error ?? "Invalid income.");

  const supabase = (await createClient()) as unknown as SupabaseReportingClient;
  const { data, error } = await supabase
    .from("income_entries")
    .insert({ ...parsed.data, user_id: userId })
    .select("*")
    .single();

  if (error) return apiError(error.message, 500);

  return NextResponse.json({ data }, { status: 201 });
}
