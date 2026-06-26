import "server-only";
import type Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getPlanFromPriceId,
  getStripeClient,
  getStripeWebhookSecret,
  type BillingPlan
} from "@/lib/stripe/client";
import type { SupabaseReportingClient } from "@/server/reporting/db";
import type { SubscriptionRow, SubscriptionStatus } from "@/server/reporting/types";

type SubscriptionUpdate = {
  userId: string;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  stripePriceId: string | null;
  plan: BillingPlan;
  status: SubscriptionStatus;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
};

function toIsoTimestamp(unixSeconds: number | null | undefined) {
  if (!unixSeconds) return null;
  return new Date(unixSeconds * 1000).toISOString();
}

function normalizeStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
  switch (status) {
    case "trialing":
    case "active":
    case "past_due":
    case "canceled":
    case "incomplete":
    case "incomplete_expired":
    case "unpaid":
      return status;
    default:
      return "none";
  }
}

function getSubscriptionPriceId(subscription: Stripe.Subscription) {
  return subscription.items.data[0]?.price?.id ?? null;
}

async function findSubscriptionByUserId(userId: string) {
  const admin = createAdminClient() as unknown as SupabaseReportingClient;
  const { data, error } = await admin
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error || !data) return null;

  return data as SubscriptionRow;
}

async function findUserIdByCustomerId(customerId: string) {
  const admin = createAdminClient() as unknown as SupabaseReportingClient;
  const { data, error } = await admin
    .from("subscriptions")
    .select("*")
    .eq("stripe_customer_id", customerId)
    .single();

  if (!error && data) {
    return (data as SubscriptionRow).user_id;
  }

  const stripe = getStripeClient();
  const customer = await stripe.customers.retrieve(customerId);

  if ("deleted" in customer && customer.deleted) return null;

  return customer.metadata?.userId ?? null;
}

async function upsertSubscription(update: SubscriptionUpdate) {
  const admin = createAdminClient() as unknown as SupabaseReportingClient;

  const { error } = await admin.from("subscriptions").upsert(
    {
      user_id: update.userId,
      stripe_customer_id: update.stripeCustomerId,
      stripe_subscription_id: update.stripeSubscriptionId,
      stripe_price_id: update.stripePriceId,
      plan: update.plan,
      status: update.status,
      current_period_start: update.currentPeriodStart,
      current_period_end: update.currentPeriodEnd,
      cancel_at_period_end: update.cancelAtPeriodEnd
    },
    { onConflict: "user_id" }
  );

  if (error) {
    throw new Error(error.message);
  }
}

async function applySubscriptionObject(subscription: Stripe.Subscription) {
  const stripeCustomerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer.id;
  const priceId = getSubscriptionPriceId(subscription);
  const mappedPlan = getPlanFromPriceId(priceId);
  const userId =
    subscription.metadata?.userId ?? (await findUserIdByCustomerId(stripeCustomerId));

  if (!userId) {
    throw new Error("Could not match Stripe subscription to a user.");
  }

  const existing = await findSubscriptionByUserId(userId);

  await upsertSubscription({
    userId,
    stripeCustomerId,
    stripeSubscriptionId: subscription.id,
    stripePriceId: priceId,
    plan: mappedPlan ?? existing?.plan ?? "free",
    status: normalizeStatus(subscription.status),
    currentPeriodStart: toIsoTimestamp(subscription.current_period_start),
    currentPeriodEnd: toIsoTimestamp(subscription.current_period_end),
    cancelAtPeriodEnd: subscription.cancel_at_period_end
  });
}

async function applyCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.client_reference_id ?? session.metadata?.userId ?? null;

  if (!userId) {
    throw new Error("Checkout session did not include a user reference.");
  }

  const customerId = typeof session.customer === "string" ? session.customer : null;
  const subscriptionId =
    typeof session.subscription === "string" ? session.subscription : null;

  if (subscriptionId) {
    const subscription = await getStripeClient().subscriptions.retrieve(subscriptionId);
    await applySubscriptionObject(subscription);
    return;
  }

  const existing = await findSubscriptionByUserId(userId);

  await upsertSubscription({
    userId,
    stripeCustomerId: customerId ?? existing?.stripe_customer_id ?? null,
    stripeSubscriptionId: subscriptionId ?? existing?.stripe_subscription_id ?? null,
    stripePriceId: existing?.stripe_price_id ?? null,
    plan: existing?.plan ?? "free",
    status: existing?.status ?? "none",
    currentPeriodStart: existing?.current_period_start ?? null,
    currentPeriodEnd: existing?.current_period_end ?? null,
    cancelAtPeriodEnd: existing?.cancel_at_period_end ?? false
  });
}

async function applyInvoiceEvent(invoice: Stripe.Invoice) {
  if (!invoice.subscription || typeof invoice.subscription !== "string") {
    return;
  }

  const subscription = await getStripeClient().subscriptions.retrieve(
    invoice.subscription
  );
  await applySubscriptionObject(subscription);
}

export function constructStripeEvent(payload: string, signature: string) {
  const webhookSecret = getStripeWebhookSecret();

  if (!webhookSecret) {
    throw new Error("Stripe webhook secret is not configured.");
  }

  return getStripeClient().webhooks.constructEvent(payload, signature, webhookSecret);
}

export async function handleStripeWebhookEvent(event: Stripe.Event) {
  switch (event.type) {
    case "checkout.session.completed":
      await applyCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
      return;
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      await applySubscriptionObject(event.data.object as Stripe.Subscription);
      return;
    case "invoice.payment_succeeded":
    case "invoice.payment_failed":
      await applyInvoiceEvent(event.data.object as Stripe.Invoice);
      return;
    default:
      return;
  }
}
