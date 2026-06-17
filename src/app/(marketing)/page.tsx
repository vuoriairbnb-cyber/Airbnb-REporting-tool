import Link from "next/link";
import { ReceiptText, ShieldCheck, Smartphone, TableProperties } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { DISCLAIMER_TEXT } from "@/lib/constants/disclaimer";

const features = [
  {
    title: "Income and expense tracking",
    description:
      "Keep property-level rental income, platform fees, expenses and notes together.",
    icon: TableProperties
  },
  {
    title: "Receipt review workflow",
    description:
      "Upload receipts, extract draft fields with AI, then review before saving.",
    icon: ReceiptText
  },
  {
    title: "Allocation assumptions",
    description: "Set rental-use percentages and calculate candidate reportable amounts.",
    icon: ShieldCheck
  },
  {
    title: "Mobile-first capture",
    description: "Use the web app from your phone and save it to the home screen.",
    icon: Smartphone
  }
];

export default function HomePage() {
  return (
    <>
      <section className="bg-secondary/60">
        <div className="mx-auto grid min-h-[calc(100vh-8rem)] max-w-6xl content-center gap-10 px-4 py-14 md:grid-cols-[1.08fr_0.92fr] md:py-20">
          <div className="flex flex-col justify-center">
            <p className="mb-4 text-sm font-medium text-primary">
              For small short-term rental hosts
            </p>
            <h1 className="max-w-3xl text-4xl font-semibold tracking-normal text-foreground sm:text-5xl">
              Airbnb income, expenses and receipts organized for tax season.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
              Track rental income, add expenses, review AI receipt scans, document
              allocation assumptions and generate preparation reports.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/signup">Start organizing</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/features">View features</Link>
              </Button>
            </div>
          </div>
          <div className="rounded-lg border bg-background p-4 shadow-sm">
            <div className="grid gap-3">
              {[
                "Rental income",
                "Candidate reportable expenses",
                "Receipts needing review"
              ].map((label, index) => (
                <div key={label} className="rounded-md border p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{label}</span>
                    <span className="text-xs font-medium text-primary">2026</span>
                  </div>
                  <p className="mt-3 text-2xl font-semibold">
                    {index === 0 ? "18,420 EUR" : index === 1 ? "4,860 EUR" : "7"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="grid gap-4 md:grid-cols-4">
          {features.map((feature) => (
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
        <div className="mx-auto max-w-6xl px-4 py-10">
          <h2 className="text-xl font-semibold">Important disclaimer</h2>
          <p className="mt-3 max-w-4xl text-sm leading-6 text-muted-foreground">
            {DISCLAIMER_TEXT}
          </p>
        </div>
      </section>
    </>
  );
}
