import {
  BarChart3,
  FileArchive,
  Percent,
  ReceiptText,
  Smartphone,
  WalletCards
} from "lucide-react";

export const marketingFeatures = [
  {
    title: "Income tracking",
    description:
      "Record rental income by property, platform and payout date so annual totals are easier to review.",
    icon: WalletCards
  },
  {
    title: "AI receipt scanning",
    description:
      "Upload receipt photos or PDFs, extract draft fields and review every result before it is used.",
    icon: ReceiptText
  },
  {
    title: "Expense allocation",
    description:
      "Document rental-use percentages and keep allocation notes next to each expense.",
    icon: Percent
  },
  {
    title: "Candidate reportable amounts",
    description:
      "Calculate candidate reportable amounts from the allocation choices the user controls.",
    icon: BarChart3
  },
  {
    title: "Reports CSV/PDF/ZIP",
    description:
      "Prepare tax-preparation reports, CSV exports and receipt archives for review.",
    icon: FileArchive
  },
  {
    title: "Mobile-first web app",
    description:
      "Capture receipts from a phone and keep the core workflow comfortable on small screens.",
    icon: Smartphone
  }
] as const;

export const pricingPlans = [
  {
    name: "Free Trial",
    price: "0 EUR",
    cadence: "for 14 days",
    description: "Try property, income and expense organization before choosing a plan.",
    features: [
      "1 property",
      "Limited receipt scans",
      "Dashboard preview",
      "CSV sample export"
    ]
  },
  {
    name: "Starter",
    price: "19 EUR",
    cadence: "per month",
    description: "For hosts organizing one or two short-term rental properties.",
    features: [
      "Up to 2 properties",
      "Monthly receipt scan allowance",
      "CSV and PDF reports",
      "Receipt archive"
    ]
  },
  {
    name: "Pro",
    price: "39 EUR",
    cadence: "per month",
    description: "For hosts who need more capacity and ZIP report packaging.",
    features: [
      "More properties",
      "Higher scan allowance",
      "Reports CSV/PDF/ZIP",
      "Custom categories later"
    ]
  }
] as const;
