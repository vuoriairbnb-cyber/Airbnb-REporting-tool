import { createClient } from "@/lib/supabase/server";
import type { SupabaseReportingClient } from "@/server/reporting/db";
import { getCurrentUserId } from "@/server/reporting/queries";

export type OnboardingStatus = {
  userId: string | null;
  hasProfile: boolean;
  approvedAt: string | null;
  disclaimerAcceptedAt: string | null;
  aiProcessingConsentAt: string | null;
  propertyCount: number;
};

export function isOnboardingComplete(status: OnboardingStatus) {
  return Boolean(
    status.userId &&
    status.hasProfile &&
    status.approvedAt &&
    status.disclaimerAcceptedAt &&
    status.propertyCount > 0
  );
}

export async function ensureUserProfile(userId: string) {
  const supabase = (await createClient()) as unknown as SupabaseReportingClient;
  const { data: existingProfile, error: existingError } = await supabase
    .from("profiles")
    .select("id,approved_at,disclaimer_accepted_at,ai_processing_consent_at")
    .eq("id", userId)
    .single();

  if (existingProfile && !existingError) return existingProfile;

  const { data, error } = await supabase
    .from("profiles")
    .insert({ id: userId })
    .select("id,approved_at,disclaimer_accepted_at,ai_processing_consent_at")
    .single();

  if (error) throw error;

  return data;
}

export async function getOnboardingStatus(): Promise<OnboardingStatus> {
  const userId = await getCurrentUserId();

  if (!userId) {
    return {
      userId: null,
      hasProfile: false,
      approvedAt: null,
      disclaimerAcceptedAt: null,
      aiProcessingConsentAt: null,
      propertyCount: 0
    };
  }

  const supabase = (await createClient()) as unknown as SupabaseReportingClient;
  const [profileResult, propertiesResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("id,approved_at,disclaimer_accepted_at,ai_processing_consent_at")
      .eq("id", userId)
      .single(),
    supabase.from("properties").select("id").eq("user_id", userId)
  ]);
  const profile = profileResult.data as {
    id: string;
    approved_at: string | null;
    disclaimer_accepted_at: string | null;
    ai_processing_consent_at: string | null;
  } | null;

  return {
    userId,
    hasProfile: Boolean(profile && !profileResult.error),
    approvedAt: profile?.approved_at ?? null,
    disclaimerAcceptedAt: profile?.disclaimer_accepted_at ?? null,
    aiProcessingConsentAt: profile?.ai_processing_consent_at ?? null,
    propertyCount: Array.isArray(propertiesResult.data) ? propertiesResult.data.length : 0
  };
}
