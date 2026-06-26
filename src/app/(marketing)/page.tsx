import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Building2,
  CheckCircle2,
  FileText,
  Receipt,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DisclaimerBlock } from "@/components/marketing/DisclaimerBlock";
import { marketingFeatures, pricingPlans } from "@/lib/constants/marketing";

const workflow = [
  {
    number: "01",
    title: "Add your property",
    body: "Set the name, currency and default allocation assumptions."
  },
  {
    number: "02",
    title: "Track income and expenses",
    body: "Log payouts, platform fees, cleaning fees and costs by property."
  },
  {
    number: "03",
    title: "Scan and review receipts",
    body: "Upload a file, review extracted fields and save a clean expense draft."
  },
  {
    number: "04",
    title: "Generate reports",
    body: "Create CSV, PDF and ZIP files for reporting preparation."
  }
];

export default function HomePage() {
  return (
    <>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,oklch(var(--accent)/0.45),transparent_58%)]" />
        <div className="mx-auto max-w-7xl px-5 pb-20 pt-14 md:pb-28 md:pt-24">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground shadow-soft">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Built for small Airbnb and short-term rental hosts
            </span>
            <h1 className="mt-6 text-4xl leading-tight sm:text-5xl md:text-6xl">
              Airbnb income, expenses and receipts{" "}
              <span className="text-primary">organized</span> for tax season
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-muted-foreground md:text-lg">
              Track rental income, scan expense receipts, allocate costs and generate
              tax-preparation reports without messy spreadsheets.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/signup">
                  Start free trial <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/features">See how it works</Link>
              </Button>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              No credit card. Start with one property.
            </p>
          </div>

          <div className="mx-auto mt-14 max-w-5xl">
            <DashboardPreview />
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-surface/50">
        <div className="mx-auto max-w-7xl px-5 py-8">
          <p className="text-center text-xs uppercase text-muted-foreground">
            Built for hosts on Airbnb, Booking.com, Vrbo and direct bookings
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-20 md:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium text-primary">The workflow</p>
          <h2 className="mt-2 text-3xl md:text-4xl">
            Receipts, income and expense allocation in one calmer place.
          </h2>
          <p className="mt-4 text-muted-foreground">
            Keep the preparation trail clear from the first receipt upload to the final
            export package.
          </p>
        </div>
        <div className="mt-12 grid gap-4 md:grid-cols-4">
          {workflow.map((step) => (
            <div
              key={step.number}
              className="rounded-2xl border border-border bg-card p-6 shadow-card"
            >
              <p className="text-2xl text-primary">{step.number}</p>
              <p className="mt-3 font-medium">{step.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-surface/60 py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-5">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-medium text-primary">Features</p>
            <h2 className="mt-2 text-3xl md:text-4xl">
              Everything for the host. Nothing you do not need.
            </h2>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {marketingFeatures.map((feature) => (
              <div
                key={feature.title}
                className="rounded-2xl border border-border bg-card p-6 shadow-card transition-shadow hover:shadow-soft"
              >
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                  <feature.icon className="h-5 w-5" />
                </span>
                <p className="mt-4 font-medium">{feature.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-20 md:py-24">
        <DisclaimerBlock />
      </section>

      <section className="bg-surface/60 py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-5">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-medium text-primary">Pricing</p>
            <h2 className="mt-2 text-3xl md:text-4xl">
              Start free. Upgrade when your workflow grows.
            </h2>
          </div>
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {pricingPlans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl border border-border bg-card p-6 shadow-card ${
                  plan.name === "Starter" ? "ring-2 ring-primary" : ""
                }`}
              >
                {plan.name === "Starter" ? (
                  <span className="mb-3 inline-block rounded-full bg-primary/10 px-3 py-1 text-[10px] font-medium uppercase text-primary">
                    Most popular
                  </span>
                ) : null}
                <p className="font-medium">{plan.name}</p>
                <p className="mt-2">
                  <span className="text-4xl">{plan.price}</span>
                  <span className="text-sm text-muted-foreground"> {plan.cadence}</span>
                </p>
                <ul className="mt-5 space-y-2 text-sm text-muted-foreground">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button asChild className="mt-6 w-full">
                  <Link href="/pricing">Choose {plan.name}</Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-20">
        <div className="overflow-hidden rounded-2xl border border-border bg-primary text-primary-foreground shadow-card">
          <div className="grid gap-6 p-10 md:grid-cols-[1fr_auto] md:items-center md:p-14">
            <div>
              <h2 className="text-3xl md:text-4xl">
                Make next reporting season the easy one.
              </h2>
              <p className="mt-2 text-primary-foreground/80">
                Start organizing your rental income and receipts in minutes.
              </p>
            </div>
            <Button asChild variant="secondary" size="lg">
              <Link href="/signup">
                Start free trial <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}

function DashboardPreview() {
  const cards = [
    { label: "Rental income", value: "€24,860", icon: BarChart3 },
    { label: "Expenses", value: "€9,420", icon: Receipt },
    { label: "Candidate reportable", value: "€7,180", icon: Building2 },
    { label: "Estimated result", value: "€15,440", icon: FileText }
  ];

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card p-3 shadow-card md:p-5">
      <div className="rounded-xl bg-surface p-4 md:p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase text-muted-foreground">Dashboard example</p>
            <p className="text-xl">Good morning, Anna</p>
          </div>
          <span className="hidden rounded-full bg-primary/10 px-3 py-1 text-xs text-primary md:inline-flex">
            EUR
          </span>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
          {cards.map((card) => (
            <div key={card.label} className="rounded-xl border border-border bg-card p-3">
              <card.icon className="h-4 w-4 text-primary" />
              <p className="mt-3 text-[11px] uppercase text-muted-foreground">
                {card.label}
              </p>
              <p className="mt-1 text-lg">{card.value}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-border bg-card p-4 shadow-soft md:col-span-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Income vs expenses</p>
              <p className="text-xs text-muted-foreground">Monthly example</p>
            </div>
            <MiniChart />
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
            <p className="text-sm font-medium">Receipts to review</p>
            <ul className="mt-3 space-y-2 text-sm">
              {["IKEA · €82.40", "K-Market · €34.10", "Power · €299.00"].map(
                (receipt) => (
                  <li
                    key={receipt}
                    className="flex items-center justify-between rounded-lg bg-muted/60 px-3 py-2"
                  >
                    <span className="truncate">{receipt}</span>
                    <span className="shrink-0 rounded-full bg-warm/15 px-2 py-0.5 text-[10px] text-warm">
                      review
                    </span>
                  </li>
                )
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniChart() {
  const income = [40, 65, 50, 80, 70, 95, 110, 90, 100, 120, 105, 130];
  const expenses = [20, 30, 25, 35, 40, 50, 45, 38, 55, 60, 48, 70];
  const max = 140;

  return (
    <div className="mt-4 flex h-32 items-end gap-1.5">
      {income.map((value, index) => (
        <div key={index} className="flex flex-1 items-end gap-0.5">
          <div
            className="flex-1 rounded-t bg-primary/80"
            style={{ height: `${(value / max) * 100}%` }}
          />
          <div
            className="flex-1 rounded-t bg-warm/70"
            style={{ height: `${(expenses[index] / max) * 100}%` }}
          />
        </div>
      ))}
    </div>
  );
}
