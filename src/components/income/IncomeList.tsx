import Link from "next/link";
import { WalletCards } from "lucide-react";
import { Pill } from "@/components/app/primitives";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/format";
import { RecordActions } from "@/components/reporting/RecordActions";
import type { IncomeEntryRow } from "@/server/reporting/types";

export function IncomeList({ entries }: { entries: IncomeEntryRow[] }) {
  if (entries.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-surface/60 p-10 text-center">
        <WalletCards className="mx-auto h-8 w-8 text-primary" />
        <p className="mt-4 font-display text-lg">No income entries</p>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
          Add rental income manually to start building your reporting preparation records.
        </p>
        <Button asChild className="mt-5">
          <Link href="/app/income/new">Add income</Link>
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
                "Property",
                "Platform",
                "Gross",
                "Platform fee",
                "Cleaning",
                "Net payout",
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
                  {entry.properties?.name ?? "No property"}
                </td>
                <td className="px-4 py-3">
                  <Pill>{entry.platform}</Pill>
                </td>
                <td className="px-4 py-3">
                  {formatCurrency(entry.gross_amount, entry.currency)}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {formatCurrency(entry.platform_fee, entry.currency)}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {formatCurrency(entry.cleaning_fee, entry.currency)}
                </td>
                <td className="px-4 py-3 font-medium text-success">
                  {formatCurrency(entry.net_payout, entry.currency)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/app/income/${entry.id}`}>Manage</Link>
                    </Button>
                    <RecordActions endpoint={`/api/income/${entry.id}`} label="Delete" />
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
                  {entry.properties?.name ?? "No property"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(entry.date)} · {entry.platform}
                </p>
              </div>
              <p className="shrink-0 font-medium text-success">
                {formatCurrency(entry.net_payout, entry.currency)}
              </p>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2 border-t border-border pt-3 text-[11px] text-muted-foreground">
              <div>
                <p className="text-[10px] uppercase">Gross</p>
                <p className="text-foreground">
                  {formatCurrency(entry.gross_amount, entry.currency)}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase">Fee</p>
                <p>{formatCurrency(entry.platform_fee, entry.currency)}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase">Cleaning</p>
                <p>{formatCurrency(entry.cleaning_fee, entry.currency)}</p>
              </div>
            </div>

            {entry.notes ? (
              <p className="mt-3 rounded-xl bg-surface/70 px-3 py-2 text-xs text-muted-foreground">
                {entry.notes}
              </p>
            ) : null}

            <div className="mt-4 flex gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href={`/app/income/${entry.id}`}>Manage</Link>
              </Button>
              <RecordActions endpoint={`/api/income/${entry.id}`} label="Delete" />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
