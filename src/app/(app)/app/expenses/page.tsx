import Link from "next/link";
import { Info, Plus } from "lucide-react";
import { DashboardCard } from "@/components/app/primitives";
import { ErrorState } from "@/components/state/ErrorState";
import { Button } from "@/components/ui/button";
import { ExpenseList } from "@/components/expenses/ExpenseList";
import { formatCurrency } from "@/lib/format";
import { ReportingFilters } from "@/components/reporting/Filters";
import {
  getCategories,
  getExpenseEntries,
  getProperties
} from "@/server/reporting/queries";
import type { ReportingFilters as ReportingFiltersType } from "@/server/reporting/types";

export default async function ExpensesPage({
  searchParams
}: {
  searchParams: Promise<ReportingFiltersType>;
}) {
  const filters = await searchParams;
  const [propertiesResult, categoriesResult, entriesResult] = await Promise.allSettled([
    getProperties(),
    getCategories(),
    getExpenseEntries(filters)
  ]);
  const properties =
    propertiesResult.status === "fulfilled" ? propertiesResult.value : [];
  const categories =
    categoriesResult.status === "fulfilled" ? categoriesResult.value : [];
  const entries = entriesResult.status === "fulfilled" ? entriesResult.value : [];
  const dataError =
    propertiesResult.status === "rejected" ||
    categoriesResult.status === "rejected" ||
    entriesResult.status === "rejected";

  const summary = entries.reduce(
    (totals, entry) => {
      const totalAmount = Number(entry.total_amount ?? 0);
      const allocationPercentage = Number(entry.allocation_percentage ?? 0);
      const candidateAmount =
        entry.candidate_reportable_amount ??
        (entry.allocation_method === "excluded"
          ? 0
          : (totalAmount * allocationPercentage) / 100);

      totals.totalExpenses += totalAmount;
      totals.candidateReportable += Number(candidateAmount ?? 0);

      if (entry.status === "needs_review" || entry.status === "draft") {
        totals.needsReview += 1;
      }

      if (
        entry.allocation_method === "manual_percentage" &&
        Number(entry.allocation_percentage ?? 0) <= 0
      ) {
        totals.missingAllocation += 1;
      }

      return totals;
    },
    {
      totalExpenses: 0,
      candidateReportable: 0,
      needsReview: 0,
      missingAllocation: 0
    }
  );

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
        <div className="flex items-start gap-3">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
            <Info className="h-4 w-4" />
          </span>
          <div className="min-w-0 text-sm">
            <p className="font-medium">Expense allocation</p>
            <p className="mt-0.5 leading-6 text-muted-foreground">
              Choose full rental use, a manual percentage, or excluded. Candidate
              reportable amount uses: total amount * allocation percentage / 100.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 sm:flex sm:flex-wrap sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">
            {entries.length} {entries.length === 1 ? "expense" : "expenses"}
          </p>
          <h1 className="mt-1 font-display text-2xl leading-tight md:text-3xl">
            Expenses
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Track expenses, expense allocation and candidate reportable amounts for
            reporting preparation.
          </p>
        </div>
        <Button asChild>
          <Link href="/app/expenses/new">
            <Plus className="h-4 w-4" />
            Add expense
          </Link>
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardCard
          label="Total expenses"
          value={formatCurrency(summary.totalExpenses)}
          hint="Recorded before allocation"
        />
        <DashboardCard
          label="Candidate reportable"
          value={formatCurrency(summary.candidateReportable)}
          hint="Based on allocation percentage"
          tone="primary"
        />
        <DashboardCard
          label="Needs review"
          value={summary.needsReview}
          hint="Draft or review-needed expenses"
          tone="warm"
        />
        <DashboardCard
          label="Missing allocation"
          value={summary.missingAllocation}
          hint="Expenses needing allocation details"
        />
      </div>

      <ReportingFilters
        filters={filters}
        properties={properties}
        categories={categories}
        includeCategory
        includeStatus
      />
      {dataError ? (
        <ErrorState
          title="Could not load expenses"
          description="Expenses could not be loaded right now. Check the Supabase access policies and try again."
        />
      ) : (
        <ExpenseList entries={entries} />
      )}
    </div>
  );
}
