import { PageHeader } from "@/components/layout/PageHeader";
import { SummaryCard } from "@/components/dashboard/SummaryCard";

const metrics = [
  ["Rental income this year", "0 EUR", "Manual entries will populate this."],
  ["Candidate reportable expenses", "0 EUR", "Calculated from reviewed expenses."],
  ["Estimated rental result", "0 EUR", "Income minus candidate expenses."],
  ["Receipts needing review", "0", "AI drafts wait here before reporting."]
];

export default function DashboardPage() {
  return (
    <>
      <PageHeader title="Dashboard" description="Your reporting preparation overview." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map(([label, value, note]) => (
          <SummaryCard key={label} label={label} value={value} note={note} />
        ))}
      </div>
    </>
  );
}
