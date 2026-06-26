import { NextResponse } from "next/server";
import { canCreateProperty } from "@/lib/stripe/entitlements";
import { createClient } from "@/lib/supabase/server";
import { propertyInputSchema } from "@/lib/validation/properties";
import { apiError, logServerError, parseJsonBody } from "@/server/reporting/api";
import type { SupabaseReportingClient } from "@/server/reporting/db";
import { getCurrentUserId } from "@/server/reporting/queries";

export async function GET() {
  const userId = await getCurrentUserId();

  if (!userId) return apiError("Authentication required.", 401);

  const supabase = (await createClient()) as unknown as SupabaseReportingClient;
  const { data, error } = await supabase
    .from("properties")
    .select("*")
    .eq("user_id", userId)
    .order("is_active", { ascending: false })
    .order("name", { ascending: true });

  if (error) {
    logServerError("properties.list", error);
    return apiError("Could not load properties.", 500);
  }

  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const userId = await getCurrentUserId();

  if (!userId) return apiError("Authentication required.", 401);

  const parsed = await parseJsonBody(request, propertyInputSchema);

  if (parsed.error || !parsed.data) return apiError(parsed.error ?? "Invalid property.");

  const propertyAccess = await canCreateProperty(userId);

  if (!propertyAccess.allowed) {
    return apiError(propertyAccess.reason ?? "Property limit reached.", 403);
  }

  const supabase = (await createClient()) as unknown as SupabaseReportingClient;
  const { data, error } = await supabase
    .from("properties")
    .insert({ ...parsed.data, user_id: userId })
    .select("*")
    .single();

  if (error) {
    logServerError("properties.create", error);
    return apiError("Could not create property.", 500);
  }

  return NextResponse.json({ data }, { status: 201 });
}
