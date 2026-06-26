import "server-only";
import { getStripeClient } from "@/lib/stripe/client";

export async function createBillingPortalSession({
  customerId,
  origin
}: {
  customerId: string;
  origin: string;
}) {
  return getStripeClient().billingPortal.sessions.create({
    customer: customerId,
    return_url: `${origin}/app/settings/billing`
  });
}
