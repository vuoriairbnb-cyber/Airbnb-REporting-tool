import { createClient } from "@/lib/supabase/server";
import { apiError } from "@/server/reporting/api";
import type { SupabaseReportingClient } from "@/server/reporting/db";
import { getCurrentUserId } from "@/server/reporting/queries";

export const ACCOUNT_APPROVAL_REQUIRED = "Account approval required.";

export type ApprovalStatus = {
  userId: string | null;
  approvedAt: string | null;
};

export async function getApprovalStatus(userId: string): Promise<ApprovalStatus> {
  const supabase = (await createClient()) as unknown as SupabaseReportingClient;
  const { data, error } = await supabase
    .from("profiles")
    .select("approved_at")
    .eq("id", userId)
    .single();

  if (error || !data) {
    return {
      userId,
      approvedAt: null
    };
  }

  return {
    userId,
    approvedAt: (data as { approved_at?: string | null }).approved_at ?? null
  };
}

export async function requireApprovedUserIdForApi() {
  const userId = await getCurrentUserId();

  if (!userId) {
    return {
      userId: null,
      response: apiError("Authentication required.", 401)
    };
  }

  const status = await getApprovalStatus(userId);

  if (!status.approvedAt) {
    return {
      userId: null,
      response: apiError(ACCOUNT_APPROVAL_REQUIRED, 403)
    };
  }

  return {
    userId,
    response: null
  };
}
