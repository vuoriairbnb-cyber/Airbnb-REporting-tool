import Link from "next/link";
import { ArrowUpRight, FileText, Receipt, ScanLine, TrendingUp } from "lucide-react";
import { DashboardCard, Pill, SectionCard } from "@/components/app/primitives";
import { DisclaimerBlock } from "@/components/marketing/DisclaimerBlock";
import { formatCurrency } from "@/lib/format";
import {
  getDashboardSummary,
  getExpenseEntries,
  getIncomeEntries,
  getReceipts
} from "@/server/reporting/queries";
import type {
  ExpenseEntryRow,
  IncomeEntryRow,
  ReceiptRow
} from "@/server/reporting/types";

const monthLabels = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];

const quickActions = [
  { href: "/app/income/new", label: "Add income", icon: TrendingUp },
  { href: "/app/expenses/new", label: "Add expense", icon: Receipt },
  { href: "/app/receipts/upload", label: "Upload receipt", icon: ScanLine },
  { href: "/app/reports", label: "Generate report", icon: FileText }
] as const;

type ActivityRow =
  | (IncomeEntryRow & { kind: "income" })
  | (ExpenseEntryRow & { kind: "expense" });

function currentYearRange() {
  const year = new Date().getFullYear();

  return {
    year,
    dateFrom: `${year}-01-01`,
    dateTo: `${year}-12-31`
  };
}

function countReceiptsNeedingReview(receipts: ReceiptRow[]) {
  return receipts.filter((receipt) => receipt.status === "needs_review").length;
}

function getActivityRows(
  incomeEntries: IncomeEntryRow[],
  expenseEntries: ExpenseEntryRow[]
) {
  return [
    ...incomeEntries.map((entry) => ({ ...entry, kind: "income" as const })),
    ...expenseEntries.map((entry) => ({ ...entry, kind: "expense" as const }))
  ]
    .sort((first, second) => {
      const firstDate = first.date ?? "";
      const secondDate = second.date ?? "";

      return secondDate.localeCompare(firstDate);
    })
    .slice(0, 6);
}

function getMonthlySeries(
  incomeEntries: IncomeEntryRow[],
  expenseEntries: ExpenseEntryRow[]
) {
  const income = Array.from({ length: 12 }, () => 0);
  const expenses = Array.from({ length: 12 }, () => 0);

  incomeEntries.forEach((entry) => {
    const month = entry.date ? new Date(`${entry.date}T00:00:00`).getMonth() : -1;
    if (month >= 0) income[month] += Number(entry.net_payout ?? entry.gross_amount ?? 0);
  });

  expenseEntries
    .filter((entry) => entry.status !== "archived")
    .forEach((entry) => {
      const month = entry.date ? new Date(`${entry.date}T00:00:00`).getMonth() : -1;
      if (month >= 0) expenses[month] += Number(entry.total_amount ?? 0);
    });

  return { income, expenses };
}

function statusLabel(status: string) {
  return (
    (
      {
        uploaded: "Uploaded",
        processing: "Processing",
        needs_review: "Needs review",
        needs_allocation: "Missing allocation",
        reviewed: "Reviewed",
        failed: "Failed",
        draft: "Draft",
        excluded: "Excluded",
        archived: "Archived"
      } as Record<string, string>
    )[status] ?? status
  );
}

function statusTone(status: string) {
  return (
    (
      {
        uploaded: "bg-muted text-muted-foreground",
        processing: "bg-primary/10 text-primary",
        needs_review: "bg-warm/15 text-warm",
        needs_allocation: "bg-warm/15 text-warm",
        draft: "bg-warm/15 text-warm",
        reviewed: "bg-success/15 text-success",
        failed: "bg-destructive/15 text-destructive",
        excluded: "bg-muted text-muted-foreground",
        archived: "bg-muted text-muted-foreground"
      } as Record<string, string>
    )[status] ?? "bg-muted text-muted-foreground"
  );
}

export default async function DashboardPage() {
  const { year, dateFrom, dateTo } = currentYearRange();
  const [summary, incomeEntries, expenseEntries, receipts] = await Promise.all([
    getDashboardSummary(),
    getIncomeEntries({ dateFrom, dateTo }),
    getExpenseEntries({ dateFrom, dateTo }),
    getReceipts()
  ]);

  const receiptsNeedingReview = countReceiptsNeedingReview(receipts);
  const activityRows = getActivityRows(incomeEntries, expenseEntries);
  const monthlySeries = getMonthlySeries(incomeEntries, expenseEntries);

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardCard
          label={`Rental income · ${year}`}
          value={formatCurrency(summary.rentalIncomeThisYear)}
          hint="Manual income entries this year"
        />
        <DashboardCard
          label={`Expenses · ${year}`}
          value={formatCurrency(summary.expensesThisYear)}
          hint="Recorded before allocation"
        />
        <DashboardCard
          label="Candidate reportable"
          value={formatCurrency(summary.candidateReportableExpenses)}
          hint="From your allocations"
        />
        <DashboardCard
          label="Estimated rental result"
          value={formatCurrency(summary.estimatedRentalResult)}
          hint="Income minus candidate reportable"
          tone="primary"
        />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <DashboardCard
          label="Receipts needing review"
          value={String(receiptsNeedingReview)}
          hint="Action recommended"
          tone="warm"
        />
        <DashboardCard
          label="Expenses missing allocation"
          value={String(summary.expensesMissingAllocation)}
          hint="Set an expense allocation percentage"
          tone="warm"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <SectionCard
          title="Income vs expenses"
          className="lg:col-span-2"
          action={<span className="text-xs text-muted-foreground">Monthly · {year}</span>}
        >
          <Chart income={monthlySeries.income} expenses={monthlySeries.expenses} />
          <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-2">
              <span className="h-2 w-3 rounded-sm bg-primary" />
              Income
            </span>
            <span className="flex items-center gap-2">
              <span className="h-2 w-3 rounded-sm bg-warm" />
              Expenses
            </span>
          </div>
        </SectionCard>

        <SectionCard title="Quick actions">
          <div className="grid grid-cols-2 gap-2">
            {quickActions.map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className="flex flex-col items-start gap-2 rounded-xl border border-border bg-card p-3 text-sm transition hover:bg-muted"
              >
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">
                  <action.icon className="h-4 w-4" />
                </span>
                {action.label}
              </Link>
            ))}
          </div>
        </SectionCard>
      </div>

      <SectionCard
        title="Recent activity"
        action={
          <Link
            href="/app/expenses"
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            View all <ArrowUpRight className="h-3 w-3" />
          </Link>
        }
      >
        <RecentActivity rows={activityRows} />
      </SectionCard>

      <DisclaimerBlock compact />
    </div>
  );
}

function Chart({ income, expenses }: { income: number[]; expenses: number[] }) {
  const max = Math.max(...income, ...expenses, 1) * 1.1;
  const hasData = income.some(Boolean) || expenses.some(Boolean);

  return (
    <div className="mt-2">
      <div className="flex h-44 items-end gap-2">
        {income.map((value, index) => {
          const incomeHeight = hasData
            ? Math.max((value / max) * 160, value ? 8 : 0)
            : 24;
          const expenseHeight = hasData
            ? Math.max((expenses[index] / max) * 160, expenses[index] ? 8 : 0)
            : 14;

          return (
            <div
              key={`${index}-${monthLabels[index]}`}
              className="flex flex-1 flex-col items-center gap-1"
            >
              <div className="flex w-full items-end gap-0.5">
                <div
                  className="flex-1 rounded-t-md bg-primary"
                  style={{ height: `${incomeHeight}px` }}
                />
                <div
                  className="flex-1 rounded-t-md bg-warm"
                  style={{ height: `${expenseHeight}px` }}
                />
              </div>
              <span className="text-[10px] text-muted-foreground">
                {monthLabels[index]}
              </span>
            </div>
          );
        })}
      </div>
      {!hasData ? (
        <p className="mt-3 text-xs text-muted-foreground">
          Add income and expenses to replace this placeholder chart with your monthly
          activity.
        </p>
      ) : null}
    </div>
  );
}

function RecentActivity({ rows }: { rows: ActivityRow[] }) {
  if (!rows.length) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-surface/60 p-10 text-center">
        <p className="font-display text-lg">No activity yet</p>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
          Add income, expenses or receipts to build your reporting preparation timeline.
        </p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-border">
      {rows.map((row) => {
        const isIncome = row.kind === "income";
        const title = isIncome
          ? `${row.platform} payout · ${row.properties?.name ?? "No property"}`
          : `${row.vendor ?? "Expense"} · ${row.properties?.name ?? "No property"}`;
        const subtitle = isIncome
          ? row.date
          : `${row.date ?? "No date"} · ${row.categories?.name ?? "No category"}`;
        const amount = isIncome
          ? Number(row.net_payout ?? row.gross_amount ?? 0)
          : Number(row.total_amount ?? 0);

        return (
          <li
            key={`${row.kind}-${row.id}`}
            className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-3 text-sm"
          >
            <div className="min-w-0">
              <p className="truncate font-medium">{title}</p>
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            </div>
            <div className="text-right">
              <p className={isIncome ? "font-medium text-success" : "font-medium"}>
                {isIncome ? "+" : "-"}
                {formatCurrency(amount)}
              </p>
              {!isIncome ? (
                <Pill tone={statusTone(row.status)}>{statusLabel(row.status)}</Pill>
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
