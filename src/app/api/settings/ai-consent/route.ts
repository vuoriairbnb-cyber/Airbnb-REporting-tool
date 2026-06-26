import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiError } from "@/server/reporting/api";
import type { SupabaseReportingClient } from "@/server/reporting/db";
import { ensureUserProfile } from "@/server/reporting/onboarding";
import { getCurrentUserId } from "@/server/reporting/queries";

export async function POST() {
  const userId = await getCurrentUserId();

  if (!userId) return apiError("Authentication required.", 401);

  await ensureUserProfile(userId);

  const supabase = (await createClient()) as unknown as SupabaseReportingClient;
  const acceptedAt = new Date().toISOString();
  const { data, error } = await supabase
    .from("profiles")
    .update({ ai_processing_consent_at: acceptedAt })
    .eq("id", userId)
    .select("ai_processing_consent_at")
    .single();

  if (error || !data) {
    return apiError(error?.message ?? "Could not enable AI processing consent.", 500);
  }

  return NextResponse.json({
    data: {
      aiProcessingConsentAt: (data as { ai_processing_consent_at: string | null })
        .ai_processing_consent_at
    }
  });
}
