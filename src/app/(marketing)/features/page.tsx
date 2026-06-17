import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { marketingFeatures } from "@/lib/constants/marketing";

export default function FeaturesPage() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-14">
      <div className="max-w-3xl">
        <p className="text-sm font-medium text-primary">Features</p>
        <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">
          Clean reporting preparation without spreadsheet sprawl
        </h1>
        <p className="mt-4 text-base leading-7 text-muted-foreground">
          HostReport keeps income tracking, AI receipt scanning, expense allocation,
          candidate reportable amounts and tax-preparation reports in one mobile-first
          workflow.
        </p>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {marketingFeatures.map((feature) => (
          <Card key={feature.title}>
            <CardHeader>
              <feature.icon className="h-5 w-5 text-primary" />
              <CardTitle>{feature.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>{feature.description}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-10 rounded-lg border bg-muted/40 p-5 sm:flex sm:items-center sm:justify-between sm:gap-6">
        <div>
          <h2 className="font-semibold">Ready to organize this year?</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Start with one property and add more reporting details as you go.
          </p>
        </div>
        <Button asChild className="mt-5 sm:mt-0">
          <Link href="/signup">Create account</Link>
        </Button>
      </div>
    </section>
  );
}
