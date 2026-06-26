import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiError } from "@/server/reporting/api";

export async function POST() {
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      return apiError(error.message, 500);
    }

    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    return apiError(
      error instanceof Error ? error.message : "Could not complete logout.",
      500
    );
  }
}

export async function GET(request: Request) {
  const response = await POST();

  if (!response.ok) {
    return response;
  }

  return NextResponse.redirect(new URL("/login", request.url));
}
