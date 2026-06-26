import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Check, CreditCard, LayoutDashboard } from "lucide-react";
import { Pill } from "@/components/app/primitives";
import { PricingPlanAction } from "@/components/pricing/PricingPlanAction";
import { BillingPortalButton } from "@/components/settings/BillingPortalButton";
import { SubscriptionSummaryCard } from "@/components/settings/SubscriptionSummaryCard";
import { Button } from "@/components/ui/button";
import { pricingPlans } from "@/lib/constants/marketing";
import { getEntitlements } from "@/lib/stripe/entitlements";
import type { BillingPlan } from "@/lib/stripe/client";
import { getCurrentUserId } from "@/server/reporting/queries";

export default async function BillingPlansPage() {
  const userId = await getCurrentUserId();

  if (!userId) {
    redirect("/login?next=/app/settings/billing/plans");
  }

  const entitlements = await getEntitlements(userId);
  const hasPaidSubscription =
    entitlements.plan !== "free" &&
    ["active", "trialing", "past_due"].includes(entitlements.status);
  const hasPortal =
    entitlements.isStripePortalConfigured && Boolean(entitlements.stripeCustomerId);
  const stripeReady =
    entitlements.isStripeCheckoutConfigured && entitlements.isStripePortalConfigured;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link href="/app/settings/billing">
            <ArrowLeft className="h-4 w-4" />
            Billing
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href="/app/dashboard">
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Link>
        </Button>
      </div>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-card">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
              <CreditCard className="h-5 w-5" />
            </span>
            <div>
              <p className="font-display text-2xl leading-tight">Plans</p>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
                Review your current subscription before changing plans in Stripe test
                mode.
              </p>
            </div>
          </div>
          <Pill tone="bg-primary/10 text-primary">{entitlements.planLabel}</Pill>
        </div>
      </section>

      <SubscriptionSummaryCard
        compactTitle="Current subscription"
        currentPeriodEnd={entitlements.currentPeriodEnd}
        hasPortal={hasPortal}
        isBillingGateDisabled={entitlements.isBillingGateDisabled}
        isStripeReady={stripeReady}
        plan={entitlements.plan}
        planLabel={entitlements.planLabel}
        status={entitlements.status}
      />

      <div className="grid gap-5 lg:grid-cols-3">
        {pricingPlans.map((plan) => {
          const planId = plan.id as BillingPlan;
          const isCurrent = planId === entitlements.plan;
          const highlighted = planId === "starter";

          return (
            <section
              key={plan.id}
              className={`rounded-2xl border bg-card p-6 shadow-card ${
                isCurrent
                  ? "border-primary ring-2 ring-primary/20"
                  : highlighted
                    ? "border-primary/60"
                    : "border-border"
              }`}
            >
              <div className="flex min-h-7 items-center justify-between gap-3">
                {highlighted ? (
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-[10px] font-medium uppercase text-primary">
                    Most popular
                  </span>
                ) : (
                  <span />
                )}
                {isCurrent ? (
                  <Pill tone="bg-primary/10 text-primary">Current plan</Pill>
                ) : null}
              </div>

              <p className="mt-4 font-medium">{plan.name}</p>
              <p className="mt-3">
                <span className="text-4xl">{plan.price}</span>
                <span className="text-sm text-muted-foreground"> {plan.cadence}</span>
              </p>
              <p className="mt-4 min-h-12 text-sm leading-6 text-muted-foreground">
                {plan.description}
              </p>

              <ul className="mt-6 space-y-3 text-sm">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-7">
                {isCurrent ? (
                  <Button className="w-full" disabled variant="outline">
                    Current plan
                  </Button>
                ) : hasPaidSubscription ? (
                  <BillingPortalButton
                    className="w-full"
                    disabled={!hasPortal}
                    label={
                      planId === "free" ? "Manage cancellation" : `Switch to ${plan.name}`
                    }
                    variant={planId === "free" ? "outline" : "default"}
                  />
                ) : (
                  <PricingPlanAction
                    planId={plan.id}
                    planName={plan.name}
                    isAuthenticated
                    billingReady={entitlements.isStripeCheckoutConfigured}
                    variant={highlighted ? "default" : "outline"}
                  />
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
