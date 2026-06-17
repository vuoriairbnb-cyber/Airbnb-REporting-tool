import Link from "next/link";
import { CheckCircle2, FileArchive, ReceiptText, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { DISCLAIMER_TEXT } from "@/lib/constants/disclaimer";
import { marketingFeatures } from "@/lib/constants/marketing";

const steps = [
  "Track rental income",
  "Scan expense receipts",
  "Set expense allocation",
  "Generate tax-preparation reports"
];

export default function HomePage() {
  return (
    <>
      <section className="border-b bg-secondary/50">
        <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl content-center gap-10 px-4 py-12 md:grid-cols-[1.05fr_0.95fr] md:py-16">
          <div className="flex flex-col justify-center">
            <p className="mb-4 text-sm font-medium text-primary">
              For small Airbnb and short-term rental hosts
            </p>
            <h1 className="max-w-3xl text-4xl font-semibold tracking-normal text-foreground sm:text-5xl">
              Airbnb income, expenses and receipts organized for tax season
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
              Track rental income, scan expense receipts, allocate costs and generate
              tax-preparation reports without messy spreadsheets.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/signup">Start free trial</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/features">Explore features</Link>
              </Button>
            </div>
            <div className="mt-7 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
              {steps.map((step) => (
                <div key={step} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border bg-background p-4 shadow-sm">
            <div className="rounded-md border bg-muted/40 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">2026 preparation overview</p>
                  <p className="text-xs text-muted-foreground">Example dashboard</p>
                </div>
                <FileArchive className="h-5 w-5 text-primary" />
              </div>
            </div>
            <div className="mt-3 grid gap-3">
              {[
                ["Rental income", "18,420 EUR"],
                ["Candidate reportable amounts", "4,860 EUR"],
                ["Receipts needing review", "7"]
              ].map(([label, value]) => (
                <div key={label} className="rounded-md border p-4">
                  <span className="text-sm text-muted-foreground">{label}</span>
                  <p className="mt-3 text-2xl font-semibold">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-semibold">Built around the host workflow</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Keep the preparation trail clear from receipt upload to final export.
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
      </section>

      <section className="border-y bg-muted/40">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-12 md:grid-cols-[0.8fr_1.2fr]">
          <div>
            <ReceiptText className="h-6 w-6 text-primary" />
            <h2 className="mt-3 text-2xl font-semibold">Receipt review stays human</h2>
          </div>
          <p className="text-sm leading-7 text-muted-foreground">
            AI receipt scanning is used to create drafts, not final records. Hosts review
            the extracted date, vendor, amount, category suggestion and warnings before
            saving an expense.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="rounded-lg border bg-background p-5 md:flex md:items-start md:justify-between md:gap-8">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold">Important disclaimer</h2>
            </div>
            <p className="mt-3 max-w-4xl text-sm leading-6 text-muted-foreground">
              {DISCLAIMER_TEXT}
            </p>
          </div>
          <Button asChild variant="outline" className="mt-5 md:mt-0">
            <Link href="/disclaimer">Read disclaimer</Link>
          </Button>
        </div>
      </section>
    </>
  );
}
