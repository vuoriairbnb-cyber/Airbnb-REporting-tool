"use client";

import Link from "next/link";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { FailureState } from "@/components/state/FailureState";
import { Button } from "@/components/ui/button";
import { parseApiError } from "@/lib/api/client";

type PricingPlanActionProps = {
  planId: "free" | "starter" | "pro";
  planName: string;
  isAuthenticated: boolean;
  billingReady: boolean;
  variant?: "default" | "outline";
};

export function PricingPlanAction({
  planId,
  planName,
  isAuthenticated,
  billingReady,
  variant = "default"
}: PricingPlanActionProps) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (planId === "free") {
    return (
      <Button asChild className="w-full" variant={variant}>
        <Link href={isAuthenticated ? "/app/dashboard" : "/signup"}>
          {isAuthenticated ? "Open dashboard" : "Start free trial"}
        </Link>
      </Button>
    );
  }

  if (!billingReady) {
    return (
      <div className="space-y-2">
        <Button className="w-full" variant={variant} disabled>
          Setup required
        </Button>
        <p className="text-xs text-muted-foreground">
          Stripe test mode env values are still missing.
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="space-y-2">
        <Button asChild className="w-full" variant={variant}>
          <Link href="/login?next=/pricing">Log in to choose {planName}</Link>
        </Button>
        <p className="text-xs leading-5 text-muted-foreground">
          Sign in first so the subscription is attached to your HostReport account.
        </p>
      </div>
    );
  }

  async function handleCheckout() {
    setIsPending(true);
    setError(null);

    try {
      const response = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          plan: planId
        })
      });
      if (!response.ok) {
        throw new Error(await parseApiError(response, "Could not start checkout."));
      }

      const body = await response.json().catch(() => null);
      if (!body?.data?.url) throw new Error("Could not start checkout.");

      window.location.assign(body.data.url);
    } catch (checkoutError) {
      setError(
        checkoutError instanceof Error
          ? checkoutError.message
          : "Could not start checkout."
      );
      setIsPending(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button
        className="w-full"
        variant={variant}
        disabled={isPending}
        onClick={handleCheckout}
      >
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {isPending ? "Opening checkout..." : `Choose ${planName}`}
      </Button>
      {error ? (
        <FailureState
          variant="inline"
          title="Could not start checkout"
          description={error}
        />
      ) : null}
    </div>
  );
}
