import Link from "next/link";
import { WalletCards } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/state/EmptyState";
import { formatCurrency, formatDate } from "@/lib/format";
import { RecordActions } from "@/components/reporting/RecordActions";
import type { IncomeEntryRow } from "@/server/reporting/types";

export function IncomeList({ entries }: { entries: IncomeEntryRow[] }) {
  if (entries.length === 0) {
    return (
      <EmptyState
        icon={WalletCards}
        title="No income entries"
        description="Add rental income manually to start building your annual report."
      />
    );
  }

  return (
    <>
      <div className="grid gap-3 md:hidden">
        {entries.map((entry) => (
          <div key={entry.id} className="rounded-lg border bg-background p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-semibold">
                  {formatCurrency(entry.net_payout ?? entry.gross_amount, entry.currency)}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {entry.platform} · {formatDate(entry.date)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {entry.properties?.name ?? "No property"}
                </p>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href={`/app/income/${entry.id}`}>Edit</Link>
              </Button>
              <RecordActions endpoint={`/api/income/${entry.id}`} label="Delete" />
            </div>
          </div>
        ))}
      </div>

      <div className="hidden overflow-hidden rounded-lg border bg-background md:block">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/60 text-muted-foreground">
            <tr>
              <th className="p-3 font-medium">Date</th>
              <th className="p-3 font-medium">Property</th>
              <th className="p-3 font-medium">Platform</th>
              <th className="p-3 font-medium">Gross</th>
              <th className="p-3 font-medium">Net payout</th>
              <th className="p-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.id} className="border-t">
                <td className="p-3">{formatDate(entry.date)}</td>
                <td className="p-3">{entry.properties?.name ?? "No property"}</td>
                <td className="p-3">{entry.platform}</td>
                <td className="p-3">
                  {formatCurrency(entry.gross_amount, entry.currency)}
                </td>
                <td className="p-3 font-medium">
                  {formatCurrency(entry.net_payout, entry.currency)}
                </td>
                <td className="p-3">
                  <div className="flex gap-2">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/app/income/${entry.id}`}>Edit</Link>
                    </Button>
                    <RecordActions endpoint={`/api/income/${entry.id}`} label="Delete" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
