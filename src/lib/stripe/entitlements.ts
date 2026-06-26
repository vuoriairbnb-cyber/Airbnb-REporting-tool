import "server-only";
import { createClient } from "@/lib/supabase/server";
import {
  formatPlanName,
  getBillingGateDisabled,
  isStripeCheckoutConfigured,
  isStripePortalConfigured,
  type BillingPlan
} from "@/lib/stripe/client";
import type { SupabaseReportingClient } from "@/server/reporting/db";
import type {
  ReportType,
  SubscriptionRow,
  SubscriptionStatus
} from "@/server/reporting/types";

type EntitlementCheck = {
  allowed: boolean;
  reason?: string;
};

type PlanEntitlements = {
  propertyLimit: number;
  monthlyReceiptScans: number;
  monthlyReports: number;
  allowedReportTypes: ReportType[];
  accurateScan: boolean;
};

export type Entitlements = PlanEntitlements & {
  plan: BillingPlan;
  planLabel: string;
  status: SubscriptionStatus;
  isBillingGateDisabled: boolean;
  isStripeCheckoutConfigured: boolean;
  isStripePortalConfigured: boolean;
  stripeCustomerId: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
};

const planMatrix: Record<BillingPlan, PlanEntitlements> = {
  free: {
    propertyLimit: 1,
    monthlyReceiptScans: 10,
    monthlyReports: 3,
    allowedReportTypes: [
      "income_csv",
      "expense_csv",
      "allocation_csv",
      "tax_preparation_pdf"
    ],
    accurateScan: false
  },
  starter: {
    propertyLimit: 2,
    monthlyReceiptScans: 40,
    monthlyReports: 20,
    allowedReportTypes: [
      "income_csv",
      "expense_csv",
      "allocation_csv",
      "tax_preparation_pdf"
    ],
    accurateScan: false
  },
  pro: {
    propertyLimit: 10,
    monthlyReceiptScans: 200,
    monthlyReports: 200,
    allowedReportTypes: [
      "income_csv",
      "expense_csv",
      "allocation_csv",
      "tax_preparation_pdf",
      "receipt_archive_zip",
      "full_reporting_zip"
    ],
    accurateScan: true
  }
};

function hasPaidAccess(status: SubscriptionStatus) {
  return status === "trialing" || status === "active" || status === "past_due";
}

function startOfCurrentMonthIso() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
}

async function getSubscriptionRow(userId: string) {
  const supabase = (await createClient()) as unknown as SupabaseReportingClient;
  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error || !data) return null;

  return data as SubscriptionRow;
}

async function countActiveProperties(userId: string) {
  const supabase = (await createClient()) as unknown as SupabaseReportingClient;
  const { data, error } = await supabase
    .from("properties")
    .select("id")
    .eq("user_id", userId)
    .eq("is_active", true);

  if (error) {
    throw new Error(error.message);
  }

  return Array.isArray(data) ? data.length : 0;
}

async function countMonthlyReceiptScans(userId: string) {
  const supabase = (await createClient()) as unknown as SupabaseReportingClient;
  const { data, error } = await supabase
    .from("usage_events")
    .select("id,event_type")
    .eq("user_id", userId)
    .gte("created_at", startOfCurrentMonthIso());

  if (error) {
    throw new Error(error.message);
  }

  if (!Array.isArray(data)) return 0;

  return data.filter(
    (event) =>
      (event as { event_type?: string }).event_type === "ai_scan_fast" ||
      (event as { event_type?: string }).event_type === "ai_scan_accurate"
  ).length;
}

async function countMonthlyReports(userId: string) {
  const supabase = (await createClient()) as unknown as SupabaseReportingClient;
  const { data, error } = await supabase
    .from("reports")
    .select("id")
    .eq("user_id", userId)
    .gte("created_at", startOfCurrentMonthIso());

  if (error) {
    throw new Error(error.message);
  }

  return Array.isArray(data) ? data.length : 0;
}

export async function hasActiveSubscription(userId: string) {
  const subscription = await getSubscriptionRow(userId);

  if (!subscription) return false;

  return hasPaidAccess(subscription.status) && subscription.plan !== "free";
}

export async function getPlan(userId: string): Promise<BillingPlan> {
  const subscription = await getSubscriptionRow(userId);

  if (!subscription) return "free";

  return hasPaidAccess(subscription.status) ? subscription.plan : "free";
}

export async function getEntitlements(userId: string): Promise<Entitlements> {
  const subscription = await getSubscriptionRow(userId);
  const plan =
    subscription && hasPaidAccess(subscription.status) ? subscription.plan : "free";
  const base = planMatrix[plan];

  return {
    ...base,
    plan,
    planLabel: formatPlanName(plan),
    status: subscription?.status ?? "none",
    isBillingGateDisabled: getBillingGateDisabled(),
    isStripeCheckoutConfigured: isStripeCheckoutConfigured(),
    isStripePortalConfigured: isStripePortalConfigured(),
    stripeCustomerId: subscription?.stripe_customer_id ?? null,
    currentPeriodStart: subscription?.current_period_start ?? null,
    currentPeriodEnd: subscription?.current_period_end ?? null,
    cancelAtPeriodEnd: subscription?.cancel_at_period_end ?? false
  };
}

export async function canCreateProperty(userId: string): Promise<EntitlementCheck> {
  const entitlements = await getEntitlements(userId);

  if (entitlements.isBillingGateDisabled) return { allowed: true };

  const propertyCount = await countActiveProperties(userId);

  if (propertyCount >= entitlements.propertyLimit) {
    return {
      allowed: false,
      reason: `Your current plan supports up to ${entitlements.propertyLimit} active propert${entitlements.propertyLimit === 1 ? "y" : "ies"}.`
    };
  }

  return { allowed: true };
}

export async function canRunAiScan(
  userId: string,
  mode: "fast" | "accurate"
): Promise<EntitlementCheck> {
  const entitlements = await getEntitlements(userId);

  if (entitlements.isBillingGateDisabled) return { allowed: true };

  if (mode === "accurate" && !entitlements.accurateScan) {
    return {
      allowed: false,
      reason: "Accurate scan is available on the Pro plan."
    };
  }

  const scanCount = await countMonthlyReceiptScans(userId);

  if (scanCount >= entitlements.monthlyReceiptScans) {
    return {
      allowed: false,
      reason: "Your monthly receipt scan limit has been reached for the current plan."
    };
  }

  return { allowed: true };
}

export async function canGenerateReport(
  userId: string,
  type: ReportType
): Promise<EntitlementCheck> {
  const entitlements = await getEntitlements(userId);

  if (entitlements.isBillingGateDisabled) return { allowed: true };

  if (!entitlements.allowedReportTypes.includes(type)) {
    return {
      allowed: false,
      reason: "This report type requires a higher billing plan."
    };
  }

  const reportCount = await countMonthlyReports(userId);

  if (reportCount >= entitlements.monthlyReports) {
    return {
      allowed: false,
      reason: "Your monthly report limit has been reached for the current plan."
    };
  }

  return { allowed: true };
}
