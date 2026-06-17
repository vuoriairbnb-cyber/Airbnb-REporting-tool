import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DISCLAIMER_TEXT } from "@/lib/constants/disclaimer";
import { pricingPlans } from "@/lib/constants/marketing";

export default function PricingPage() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-14">
      <div className="max-w-3xl">
        <p className="text-sm font-medium text-primary">Pricing</p>
        <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">
          Placeholder plans for the beta
        </h1>
        <p className="mt-4 text-base leading-7 text-muted-foreground">
          Choose the level that matches how many properties, receipt scans and
          tax-preparation reports you expect to manage.
        </p>
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        {pricingPlans.map((plan) => (
          <Card key={plan.name} className="flex flex-col">
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
              <div className="mt-4">
                <span className="text-3xl font-semibold">{plan.price}</span>
                <span className="ml-2 text-sm text-muted-foreground">{plan.cadence}</span>
              </div>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col">
              <p className="text-sm leading-6 text-muted-foreground">
                {plan.description}
              </p>
              <div className="mt-5 grid gap-3 text-sm">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
              <Button asChild className="mt-6 w-full">
                <Link href="/signup">Choose {plan.name}</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8 rounded-lg border bg-muted/40 p-5 text-sm leading-6 text-muted-foreground">
        {DISCLAIMER_TEXT}
      </div>
    </section>
  );
}
