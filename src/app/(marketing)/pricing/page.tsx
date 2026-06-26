import { Check } from "lucide-react";
import { DisclaimerBlock } from "@/components/marketing/DisclaimerBlock";
import { PricingPlanAction } from "@/components/pricing/PricingPlanAction";
import { pricingPlans } from "@/lib/constants/marketing";
import { isStripeCheckoutConfigured } from "@/lib/stripe/client";
import { createClient } from "@/lib/supabase/server";

export default async function PricingPage() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  const isAuthenticated = Boolean(user);
  const billingReady = isStripeCheckoutConfigured();

  return (
    <section className="mx-auto max-w-7xl px-5 py-16 md:py-24">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-medium text-primary">Pricing</p>
        <h1 className="mt-2 text-4xl leading-tight md:text-5xl">
          Simple pricing for hosts.
        </h1>
        <p className="mt-4 text-muted-foreground">
          Use Stripe test mode to try subscription checkout before production billing is
          enabled.
        </p>
      </div>

      <div className="mt-12 grid gap-5 md:grid-cols-3">
        {pricingPlans.map((plan) => {
          const highlighted = plan.name === "Starter";

          return (
            <div
              key={plan.name}
              className={`rounded-2xl border border-border bg-card p-7 shadow-card ${
                highlighted ? "ring-2 ring-primary" : ""
              }`}
            >
              {highlighted ? (
                <span className="mb-3 inline-block rounded-full bg-primary/10 px-3 py-1 text-[10px] font-medium uppercase text-primary">
                  Most popular
                </span>
              ) : null}
              <p className="font-medium">{plan.name}</p>
              <p className="mt-3">
                <span className="text-5xl">{plan.price}</span>
                <span className="text-sm text-muted-foreground"> {plan.cadence}</span>
              </p>
              <p className="mt-4 text-sm leading-6 text-muted-foreground">
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
                <PricingPlanAction
                  planId={plan.id}
                  planName={plan.name}
                  isAuthenticated={isAuthenticated}
                  billingReady={billingReady}
                  variant={highlighted ? "default" : "outline"}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-14">
        <DisclaimerBlock />
      </div>
    </section>
  );
}
