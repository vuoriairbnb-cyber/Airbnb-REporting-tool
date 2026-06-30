import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { propertyInputSchema } from "@/lib/validation/properties";
import { apiError, logServerError, parseJsonBody } from "@/server/reporting/api";
import { requireApprovedUserIdForApi } from "@/server/reporting/approval";
import type { SupabaseReportingClient } from "@/server/reporting/db";
import { ensureUserProfile } from "@/server/reporting/onboarding";

const completeOnboardingSchema = z.object({
  acceptDisclaimer: z.boolean(),
  enableAiProcessing: z.boolean().optional().default(false),
  property: z.unknown().optional()
});

export async function POST(request: Request) {
  const approval = await requireApprovedUserIdForApi();

  if (approval.response) return approval.response;

  const userId = approval.userId;

  const parsed = await parseJsonBody(request, completeOnboardingSchema);

  if (parsed.error || !parsed.data) {
    return apiError(parsed.error ?? "Invalid onboarding details.");
  }

  if (!parsed.data.acceptDisclaimer) {
    return apiError("You must accept the disclaimer to continue.", 400);
  }

  const supabase = (await createClient()) as unknown as SupabaseReportingClient;
  await ensureUserProfile(userId);

  const acceptedAt = new Date().toISOString();
  const profileUpdate: {
    disclaimer_accepted_at: string;
    ai_processing_consent_at?: string;
  } = {
    disclaimer_accepted_at: acceptedAt
  };

  if (parsed.data.enableAiProcessing) {
    profileUpdate.ai_processing_consent_at = acceptedAt;
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update(profileUpdate)
    .eq("id", userId);

  if (profileError) {
    logServerError("onboarding.profile", profileError);
    return apiError("Could not update onboarding profile.", 500);
  }

  const { data: existingProperties, error: propertiesError } = await supabase
    .from("properties")
    .select("id")
    .eq("user_id", userId);

  if (propertiesError) {
    logServerError("onboarding.properties", propertiesError);
    return apiError("Could not check onboarding properties.", 500);
  }

  const propertyCount = Array.isArray(existingProperties) ? existingProperties.length : 0;

  if (propertyCount === 0) {
    const property = propertyInputSchema.safeParse(parsed.data.property);

    if (!property.success) {
      return apiError(
        "Add a property name, country and currency to finish onboarding.",
        400
      );
    }

    const { error: propertyError } = await supabase
      .from("properties")
      .insert({ ...property.data, user_id: userId });

    if (propertyError) {
      logServerError("onboarding.property_create", propertyError);
      return apiError("Could not create first property.", 500);
    }
  }

  return NextResponse.json({ data: { completed: true } });
}
