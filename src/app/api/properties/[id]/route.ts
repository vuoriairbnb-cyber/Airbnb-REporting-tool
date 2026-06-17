import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { propertyInputSchema } from "@/lib/validation/properties";
import { apiError, parseJsonBody } from "@/server/reporting/api";
import type { SupabaseReportingClient } from "@/server/reporting/db";
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
    .from("properties")
    .select("*")
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

  const parsed = await parseJsonBody(request, propertyInputSchema.partial());

  if (parsed.error || !parsed.data) return apiError(parsed.error ?? "Invalid property.");

  const supabase = (await createClient()) as unknown as SupabaseReportingClient;
  const { data, error } = await supabase
    .from("properties")
    .update(parsed.data)
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
    .from("properties")
    .update({ is_active: false })
    .eq("id", id)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error) return apiError(error.message, 500);

  return NextResponse.json({ data });
}
