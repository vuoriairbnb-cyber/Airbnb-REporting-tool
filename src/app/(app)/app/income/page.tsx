import Link from "next/link";
import { WalletCards } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/PageHeader";
import { ReportingFilters } from "@/components/reporting/Filters";
import { IncomeList } from "@/components/income/IncomeList";
import { getIncomeEntries, getProperties } from "@/server/reporting/queries";
import type { ReportingFilters as ReportingFiltersType } from "@/server/reporting/types";

export default async function IncomePage({
  searchParams
}: {
  searchParams: Promise<ReportingFiltersType>;
}) {
  const filters = await searchParams;
  const [properties, entries] = await Promise.all([
    getProperties(),
    getIncomeEntries(filters)
  ]);

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          title="Income"
          description="Track rental payouts and platform fees by property."
        />
        <Button asChild>
          <Link href="/app/income/new">
            <WalletCards className="h-4 w-4" />
            Add income
          </Link>
        </Button>
      </div>
      <ReportingFilters filters={filters} properties={properties} />
      <IncomeList entries={entries} />
    </>
  );
}
