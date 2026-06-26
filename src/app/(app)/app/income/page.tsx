import Link from "next/link";
import { Plus } from "lucide-react";
import { DashboardCard } from "@/components/app/primitives";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/format";
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

  const totals = entries.reduce(
    (sum, entry) => {
      sum.gross += Number(entry.gross_amount ?? 0);
      sum.platformFees += Number(entry.platform_fee ?? 0);
      sum.cleaningFees += Number(entry.cleaning_fee ?? 0);
      sum.netPayout += Number(entry.net_payout ?? entry.gross_amount ?? 0);
      return sum;
    },
    { gross: 0, platformFees: 0, cleaningFees: 0, netPayout: 0 }
  );

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 sm:flex sm:flex-wrap sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">
            {entries.length} {entries.length === 1 ? "income entry" : "income entries"}
          </p>
          <h1 className="mt-1 font-display text-2xl leading-tight md:text-3xl">Income</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Track rental income, platform fees, cleaning fees and net payout by property
            for reporting preparation.
          </p>
        </div>
        <Button asChild>
          <Link href="/app/income/new">
            <Plus className="h-4 w-4" />
            Add income
          </Link>
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardCard
          label="Gross rental income"
          value={formatCurrency(totals.gross)}
          hint="Before fees and cleaning"
        />
        <DashboardCard
          label="Platform fees"
          value={formatCurrency(totals.platformFees)}
          hint="Recorded platform deductions"
        />
        <DashboardCard
          label="Cleaning fees"
          value={formatCurrency(totals.cleaningFees)}
          hint="Cleaning amounts tracked here"
          tone="warm"
        />
        <DashboardCard
          label="Net payout"
          value={formatCurrency(totals.netPayout)}
          hint="Rental income after recorded fees"
          tone="primary"
        />
      </div>

      <ReportingFilters filters={filters} properties={properties} />
      <IncomeList entries={entries} />
    </div>
  );
}
