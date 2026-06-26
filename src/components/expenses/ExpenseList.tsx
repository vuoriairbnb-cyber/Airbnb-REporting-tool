import Link from "next/link";
import { Receipt } from "lucide-react";
import { Pill } from "@/components/app/primitives";
import { Button } from "@/components/ui/button";
import { RecordActions } from "@/components/reporting/RecordActions";
import { formatCurrency, formatDate } from "@/lib/format";
import type { ExpenseEntryRow, ExpenseStatus } from "@/server/reporting/types";

function candidateAmount(entry: ExpenseEntryRow) {
  if (entry.candidate_reportable_amount !== null) {
    return entry.candidate_reportable_amount;
  }

  if (entry.allocation_method === "excluded") {
    return 0;
  }

  return (
    (Number(entry.total_amount ?? 0) * Number(entry.allocation_percentage ?? 0)) / 100
  );
}

function allocationMethodLabel(method: string) {
  const labels: Record<string, string> = {
    excluded: "Excluded",
    full_rental_use: "Full rental use",
    manual_percentage: "Manual percentage"
  };

  return labels[method] ?? method.replaceAll("_", " ");
}

function statusLabel(status: ExpenseStatus) {
  const labels: Record<ExpenseStatus, string> = {
    archived: "Archived",
    draft: "Draft",
    excluded: "Excluded",
    needs_review: "Needs review",
    reviewed: "Reviewed"
  };

  return labels[status];
}

function statusTone(status: ExpenseStatus) {
  const tones: Record<ExpenseStatus, string> = {
    archived: "bg-muted text-muted-foreground",
    draft: "bg-warning/15 text-warning",
    excluded: "bg-muted text-muted-foreground",
    needs_review: "bg-warm/20 text-warm-foreground",
    reviewed: "bg-success/15 text-success"
  };

  return tones[status];
}

function AllocationChip({ percentage }: { percentage: number }) {
  const tone =
    percentage === 100
      ? "bg-success/15 text-success"
      : percentage === 0
        ? "bg-muted text-muted-foreground"
        : "bg-primary/10 text-primary";

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${tone}`}
    >
      {percentage}%
    </span>
  );
}

export function ExpenseList({ entries }: { entries: ExpenseEntryRow[] }) {
  if (entries.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-surface/60 p-10 text-center">
        <Receipt className="mx-auto h-8 w-8 text-primary" />
        <p className="mt-4 font-display text-lg">No expenses yet</p>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
          Add expenses manually and document their expense allocation for reporting
          preparation.
        </p>
        <Button asChild className="mt-5">
          <Link href="/app/expenses/new">Add expense</Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="hidden overflow-hidden rounded-2xl border border-border bg-card md:block">
        <table className="w-full text-sm">
          <thead className="bg-surface/60 text-left text-xs uppercase tracking-normal text-muted-foreground">
            <tr>
              {[
                "Date",
                "Vendor",
                "Property",
                "Category",
                "Total",
                "Allocation",
                "Candidate reportable",
                "Status",
                "Actions"
              ].map((heading) => (
                <th key={heading} className="px-4 py-3 font-medium">
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {entries.map((entry) => (
              <tr key={entry.id} className="hover:bg-muted/40">
                <td className="px-4 py-3">{formatDate(entry.date)}</td>
                <td className="px-4 py-3 font-medium">
                  {entry.vendor ?? "Unnamed expense"}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {entry.properties?.name ?? "No property"}
                </td>
                <td className="px-4 py-3">
                  <Pill>{entry.categories?.name ?? "No category"}</Pill>
                </td>
                <td className="px-4 py-3">
                  {formatCurrency(entry.total_amount, entry.currency)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-1">
                    <AllocationChip percentage={entry.allocation_percentage} />
                    <span className="text-xs text-muted-foreground">
                      {allocationMethodLabel(entry.allocation_method)}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 font-medium text-primary">
                  {formatCurrency(candidateAmount(entry), entry.currency)}
                </td>
                <td className="px-4 py-3">
                  <Pill tone={statusTone(entry.status)}>{statusLabel(entry.status)}</Pill>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/app/expenses/${entry.id}`}>Manage</Link>
                    </Button>
                    <RecordActions
                      endpoint={`/api/expenses/${entry.id}`}
                      label="Archive"
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 md:hidden">
        {entries.map((entry) => (
          <div
            key={entry.id}
            className="rounded-2xl border border-border bg-card p-4 shadow-card"
          >
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
              <div className="min-w-0">
                <p className="truncate font-medium">
                  {entry.vendor ?? "Unnamed expense"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(entry.date)} / {entry.properties?.name ?? "No property"}
                </p>
              </div>
              <p className="shrink-0 font-medium">
                {formatCurrency(entry.total_amount, entry.currency)}
              </p>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3 text-xs">
              <Pill tone={statusTone(entry.status)}>{statusLabel(entry.status)}</Pill>
              <Pill>{entry.categories?.name ?? "No category"}</Pill>
              <AllocationChip percentage={entry.allocation_percentage} />
              <span className="ml-auto font-medium text-primary">
                {formatCurrency(candidateAmount(entry), entry.currency)} reportable
              </span>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-muted-foreground">
              <div className="rounded-xl bg-surface/70 px-3 py-2">
                <p className="text-[10px] uppercase">Allocation method</p>
                <p className="mt-0.5 text-foreground">
                  {allocationMethodLabel(entry.allocation_method)}
                </p>
              </div>
              <div className="rounded-xl bg-surface/70 px-3 py-2">
                <p className="text-[10px] uppercase">Candidate amount</p>
                <p className="mt-0.5 text-foreground">
                  {formatCurrency(candidateAmount(entry), entry.currency)}
                </p>
              </div>
            </div>

            {entry.notes ? (
              <p className="mt-3 rounded-xl bg-surface/70 px-3 py-2 text-xs text-muted-foreground">
                {entry.notes}
              </p>
            ) : null}

            <div className="mt-4 flex gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href={`/app/expenses/${entry.id}`}>Manage</Link>
              </Button>
              <RecordActions endpoint={`/api/expenses/${entry.id}`} label="Archive" />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
