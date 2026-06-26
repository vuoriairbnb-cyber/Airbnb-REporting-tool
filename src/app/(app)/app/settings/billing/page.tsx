import Link from "next/link";
import { ReceiptText } from "lucide-react";
import { SubscriptionSummaryCard } from "@/components/settings/SubscriptionSummaryCard";
import { Button } from "@/components/ui/button";
import { getEntitlements } from "@/lib/stripe/entitlements";
import { getCurrentUserId } from "@/server/reporting/queries";

export default async function BillingPage() {
  const userId = await getCurrentUserId();
  const entitlements = userId ? await getEntitlements(userId) : null;
  const stripeReady =
    entitlements?.isStripeCheckoutConfigured && entitlements?.isStripePortalConfigured;
  const hasPortal = Boolean(stripeReady && entitlements?.stripeCustomerId);

  return (
    <div className="space-y-5">
      <div className="min-w-0">
        <p className="text-sm text-muted-foreground">Settings</p>
        <h1 className="mt-1 font-display text-2xl leading-tight md:text-3xl">Billing</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Review the current subscription plan, Stripe test-mode status and billing portal
          access for this workspace.
        </p>
      </div>

      <SubscriptionSummaryCard
        currentPeriodEnd={entitlements?.currentPeriodEnd ?? null}
        hasPortal={hasPortal}
        isBillingGateDisabled={entitlements?.isBillingGateDisabled}
        isStripeReady={Boolean(stripeReady)}
        plan={entitlements?.plan ?? "free"}
        planLabel={entitlements?.planLabel ?? "Free"}
        status={entitlements?.status ?? "none"}
      />

      {!stripeReady ? (
        <div className="rounded-xl border border-warm/30 bg-warm/10 p-4 text-sm text-warm-foreground">
          Stripe test-mode env values are still missing. Add the Stripe secret key,
          webhook secret and test price IDs before using checkout or the billing portal.
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline">
          <Link href="/app/settings/billing/plans">
            <ReceiptText className="h-4 w-4" />
            Compare plans
          </Link>
        </Button>
      </div>
    </div>
  );
}
