import Link from "next/link";
import {
  BarChart3,
  Building2,
  CheckCircle2,
  FileText,
  Percent,
  Receipt,
  ScanLine,
  Smartphone,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DisclaimerBlock } from "@/components/marketing/DisclaimerBlock";

const sections = [
  {
    icon: BarChart3,
    title: "Income tracking",
    body: "Log payouts from Airbnb, Booking.com, Vrbo and direct bookings. Track gross amount, platform fee, cleaning fee and net payout per stay."
  },
  {
    icon: Receipt,
    title: "Expense tracking",
    body: "Capture vendor, category, date and total. Filter by property or date range and keep every cost tied to the right place."
  },
  {
    icon: ScanLine,
    title: "Receipt scanning",
    body: "Upload a receipt image or PDF. The app extracts date, vendor, total, tax amount and a suggested category for your review."
  },
  {
    icon: CheckCircle2,
    title: "Receipt review",
    body: "Every extracted field is editable. Confidence details and warnings help you review the draft before saving."
  },
  {
    icon: Percent,
    title: "Expense allocation",
    body: "Choose full rental use, a manual percentage, or excluded. Candidate reportable amounts update from your allocation."
  },
  {
    icon: Building2,
    title: "Candidate reportable amounts",
    body: "Candidate reportable amount equals total amount multiplied by allocation percentage. You control and review the inputs."
  },
  {
    icon: FileText,
    title: "Reports and exports",
    body: "Prepare income CSV, expense CSV, allocation CSV, tax-preparation PDF summaries, receipt archive ZIP files and full reporting ZIP files."
  },
  {
    icon: Smartphone,
    title: "Mobile-first use",
    body: "Designed for one-handed use on your phone. Add the web app to your Home Screen and capture receipts as you go."
  }
];

export default function FeaturesPage() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-16 md:py-24">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-medium text-primary">Features</p>
        <h1 className="mt-2 text-4xl leading-tight md:text-5xl">
          A focused toolkit for short-term rental hosts.
        </h1>
        <p className="mt-4 text-muted-foreground">
          Not an accounting suite. Not a bookkeeping service. Just the pieces a host needs
          for cleaner reporting preparation.
        </p>
      </div>

      <div className="mt-14 grid gap-4 md:grid-cols-2">
        {sections.map((section) => (
          <article
            key={section.title}
            className="rounded-2xl border border-border bg-card p-7 shadow-card"
          >
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
              <section.icon className="h-5 w-5" />
            </span>
            <h2 className="mt-5 text-xl">{section.title}</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{section.body}</p>
          </article>
        ))}
      </div>

      <div className="mt-12">
        <DisclaimerBlock />
      </div>

      <div className="mt-12 text-center">
        <Button asChild size="lg">
          <Link href="/signup">
            <Sparkles className="h-4 w-4" />
            Try HostReport free
          </Link>
        </Button>
      </div>
    </section>
  );
}
