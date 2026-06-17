import { PageHeader } from "@/components/layout/PageHeader";
import { SummaryCard } from "@/components/dashboard/SummaryCard";
import { formatCurrency } from "@/lib/format";
import { getDashboardSummary } from "@/server/reporting/queries";

export default async function DashboardPage() {
  const summary = await getDashboardSummary();

  const metrics = [
    [
      "Rental income this year",
      formatCurrency(summary.rentalIncomeThisYear),
      "Manual income entries for the current year."
    ],
    [
      "Expenses this year",
      formatCurrency(summary.expensesThisYear),
      "Total recorded expenses before allocation."
    ],
    [
      "Candidate reportable expenses",
      formatCurrency(summary.candidateReportableExpenses),
      "Calculated from allocation percentages."
    ],
    [
      "Estimated rental result",
      formatCurrency(summary.estimatedRentalResult),
      "Income minus candidate reportable expenses."
    ],
    [
      "Expenses missing allocation",
      String(summary.expensesMissingAllocation),
      "Manual percentage entries that need attention."
    ]
  ];

  return (
    <>
      <PageHeader title="Dashboard" description="Your reporting preparation overview." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {metrics.map(([label, value, note]) => (
          <SummaryCard key={label} label={label} value={value} note={note} />
        ))}
      </div>
    </>
  );
}
