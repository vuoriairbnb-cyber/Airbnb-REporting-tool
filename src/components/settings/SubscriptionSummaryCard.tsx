import Link from "next/link";
import type { Route } from "next";
import { CalendarDays, CreditCard, ReceiptText } from "lucide-react";
import { Pill } from "@/components/app/primitives";
import { BillingPortalButton } from "@/components/settings/BillingPortalButton";
import { Button } from "@/components/ui/button";
import type { BillingPlan } from "@/lib/stripe/client";
import type { SubscriptionStatus } from "@/server/reporting/types";

type SubscriptionSummaryCardProps = {
  plan: BillingPlan;
  planLabel: string;
  status: SubscriptionStatus;
  currentPeriodEnd: string | null;
  hasPortal: boolean;
  isStripeReady: boolean;
  isBillingGateDisabled?: boolean;
  plansHref?: Route;
  compactTitle?: string;
};

function formatTimestamp(value: string | null) {
  if (!value) return "Not available";

  return new Intl.DateTimeFormat("en-FI", {
    dateStyle: "medium"
  }).format(new Date(value));
}

function formatStatus(status: string) {
  return status.replaceAll("_", " ");
}

function getStatusTone(status: SubscriptionStatus) {
  switch (status) {
    case "active":
      return "bg-primary/10 text-primary";
    case "trialing":
      return "bg-blue-50 text-blue-700";
    case "past_due":
      return "bg-warm/20 text-warm-foreground";
    case "canceled":
    case "incomplete_expired":
    case "unpaid":
      return "bg-muted text-muted-foreground";
    default:
      return "bg-surface text-muted-foreground";
  }
}

export function SubscriptionSummaryCard({
  plan,
  planLabel,
  status,
  currentPeriodEnd,
  hasPortal,
  isStripeReady,
  isBillingGateDisabled = false,
  plansHref = "/app/settings/billing/plans",
  compactTitle = "Subscription overview"
}: SubscriptionSummaryCardProps) {
  const hasActiveSubscription =
    plan !== "free" && ["active", "trialing", "past_due"].includes(status);

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
      <div className="border-b border-border bg-surface/50 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
              <CreditCard className="h-5 w-5" />
            </span>
            <div>
              <p className="font-display text-lg">{compactTitle}</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Manage your subscription and billing details through Stripe.
              </p>
            </div>
          </div>
          <Pill
            tone={
              isStripeReady
                ? "bg-primary/10 text-primary"
                : "bg-warm/20 text-warm-foreground"
            }
          >
            {isStripeReady ? "Stripe test mode" : "Setup required"}
          </Pill>
        </div>
      </div>

      <div className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-xs font-medium uppercase text-muted-foreground">
              Current plan
            </p>
            <p className="mt-1 font-display text-2xl leading-tight">{planLabel}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase text-muted-foreground">Status</p>
            <div className="mt-2">
              <Pill tone={getStatusTone(status)}>{formatStatus(status)}</Pill>
            </div>
          </div>
          <div>
            <p className="text-xs font-medium uppercase text-muted-foreground">
              Current period end
            </p>
            <p className="mt-1 flex items-center gap-2 text-sm text-foreground">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              {formatTimestamp(currentPeriodEnd)}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row lg:justify-end">
          {hasActiveSubscription ? (
            <BillingPortalButton
              className="w-full sm:w-auto"
              disabled={!hasPortal}
              label="Manage billing"
            />
          ) : (
            <Button asChild className="w-full sm:w-auto">
              <Link href={plansHref}>
                <ReceiptText className="h-4 w-4" />
                View plans
              </Link>
            </Button>
          )}
          {hasActiveSubscription ? (
            <Button asChild className="w-full sm:w-auto" variant="outline">
              <Link href={plansHref}>
                <ReceiptText className="h-4 w-4" />
                View plans
              </Link>
            </Button>
          ) : null}
        </div>
      </div>

      {!hasActiveSubscription ? (
        <div className="border-t border-border bg-surface/40 px-5 py-4 text-sm text-muted-foreground">
          No active paid subscription yet. Choose a plan when you are ready to unlock more
          reporting preparation capacity.
        </div>
      ) : null}

      {isBillingGateDisabled ? (
        <div className="border-t border-border bg-primary/5 px-5 py-3 text-xs text-primary">
          Billing gate bypass is enabled in development, so current app flows continue to
          work while you test plans.
        </div>
      ) : null}
    </section>
  );
}
