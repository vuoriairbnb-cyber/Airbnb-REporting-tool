import "server-only";
import Stripe from "stripe";

export type BillingPlan = "free" | "starter" | "pro";
export type PaidBillingPlan = Exclude<BillingPlan, "free">;

let stripeClient: Stripe | null = null;

function readEnv(name: string) {
  const value = process.env[name]?.trim();
  return value ? value : null;
}

export function getStripeSecretKey() {
  return readEnv("STRIPE_SECRET_KEY");
}

export function getStripeWebhookSecret() {
  return readEnv("STRIPE_WEBHOOK_SECRET");
}

export function getStripeClient() {
  const secretKey = getStripeSecretKey();

  if (!secretKey) {
    throw new Error("Stripe test mode is not configured yet.");
  }

  if (!stripeClient) {
    stripeClient = new Stripe(secretKey);
  }

  return stripeClient;
}

export function getStripePriceId(plan: PaidBillingPlan) {
  const envName =
    plan === "starter" ? "STRIPE_PRICE_STARTER_MONTHLY" : "STRIPE_PRICE_PRO_MONTHLY";
  const legacyEnvName =
    plan === "starter" ? "STRIPE_STARTER_PRICE_ID" : "STRIPE_PRO_PRICE_ID";
  const priceId = readEnv(envName) ?? readEnv(legacyEnvName);

  if (!priceId) {
    throw new Error(`Stripe price for the ${plan} plan is not configured.`);
  }

  return priceId;
}

export function getBillingGateDisabled() {
  const envValue = readEnv("DISABLE_BILLING_GATE");

  if (envValue !== null) {
    return envValue.toLowerCase() === "true";
  }

  return process.env.NODE_ENV !== "production";
}

export function isStripeCheckoutConfigured() {
  return Boolean(
    getStripeSecretKey() &&
    (readEnv("STRIPE_PRICE_STARTER_MONTHLY") ?? readEnv("STRIPE_STARTER_PRICE_ID")) &&
    (readEnv("STRIPE_PRICE_PRO_MONTHLY") ?? readEnv("STRIPE_PRO_PRICE_ID"))
  );
}

export function isStripePortalConfigured() {
  return Boolean(getStripeSecretKey());
}

export function formatPlanName(plan: BillingPlan) {
  switch (plan) {
    case "starter":
      return "Starter";
    case "pro":
      return "Pro";
    default:
      return "Free";
  }
}

export function getPlanFromPriceId(
  priceId: string | null | undefined
): BillingPlan | null {
  if (!priceId) return null;
  if (priceId === getStripePriceId("starter")) return "starter";
  if (priceId === getStripePriceId("pro")) return "pro";

  return null;
}
