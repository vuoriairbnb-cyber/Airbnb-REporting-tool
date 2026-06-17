import Link from "next/link";
import { Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/PageHeader";
import { ExpenseList } from "@/components/expenses/ExpenseList";
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
  const [properties, categories, entries] = await Promise.all([
    getProperties(),
    getCategories(),
    getExpenseEntries(filters)
  ]);

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          title="Expenses"
          description="Track expenses, allocation percentages and candidate reportable amounts."
        />
        <Button asChild>
          <Link href="/app/expenses/new">
            <Receipt className="h-4 w-4" />
            Add expense
          </Link>
        </Button>
      </div>
      <ReportingFilters
        filters={filters}
        properties={properties}
        categories={categories}
        includeCategory
        includeStatus
      />
      <ExpenseList entries={entries} />
    </>
  );
}
