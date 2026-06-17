import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const plans = [
  { name: "Free Trial", price: "0 EUR", detail: "1 property, limited scans, basic CSV preview" },
  { name: "Starter", price: "19 EUR", detail: "1-2 properties, receipt scans, CSV and PDF reports" },
  { name: "Pro", price: "39 EUR", detail: "More properties, accurate scans, ZIP exports and custom categories" }
];

export default function PricingPage() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-14">
      <h1 className="text-3xl font-semibold">Pricing</h1>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {plans.map((plan) => (
          <Card key={plan.name}>
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
              <p className="text-2xl font-semibold">{plan.price}</p>
            </CardHeader>
            <CardContent className="space-y-5">
              <p className="text-sm text-muted-foreground">{plan.detail}</p>
              <Button asChild className="w-full">
                <Link href="/signup">Choose {plan.name}</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
