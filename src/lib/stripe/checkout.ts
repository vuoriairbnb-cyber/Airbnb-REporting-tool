import "server-only";
import type Stripe from "stripe";
import {
  getStripeClient,
  getStripePriceId,
  type PaidBillingPlan
} from "@/lib/stripe/client";

type CustomerDetails = {
  userId: string;
  email: string;
  fullName?: string | null;
};

export async function createCheckoutSession({
  userId,
  email,
  origin,
  plan
}: CustomerDetails & {
  origin: string;
  plan: PaidBillingPlan;
}) {
  const stripe = getStripeClient();
  const priceId = getStripePriceId(plan);

  return stripe.checkout.sessions.create({
    mode: "subscription",
    customer_email: email,
    client_reference_id: userId,
    success_url: `${origin}/app/settings/billing?checkout=success`,
    cancel_url: `${origin}/pricing?checkout=cancelled`,
    allow_promotion_codes: true,
    line_items: [
      {
        price: priceId,
        quantity: 1
      }
    ],
    metadata: {
      userId,
      plan
    },
    subscription_data: {
      metadata: {
        userId,
        plan
      }
    }
  });
}

export function getCustomerIdFromCheckoutSession(session: Stripe.Checkout.Session) {
  if (!session.customer || typeof session.customer !== "string") return null;
  return session.customer;
}
