import Link from "next/link";
import { Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/state/EmptyState";
import { RecordActions } from "@/components/reporting/RecordActions";
import { formatCurrency, formatDate } from "@/lib/format";
import type { ExpenseEntryRow } from "@/server/reporting/types";

export function ExpenseList({ entries }: { entries: ExpenseEntryRow[] }) {
  if (entries.length === 0) {
    return (
      <EmptyState
        icon={Receipt}
        title="No expenses yet"
        description="Add expenses manually and document their expense allocation."
      />
    );
  }

  return (
    <>
      <div className="grid gap-3 md:hidden">
        {entries.map((entry) => (
          <div key={entry.id} className="rounded-lg border bg-background p-4">
            <h2 className="font-semibold">{entry.vendor ?? "Unnamed expense"}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {formatDate(entry.date)} · {entry.properties?.name ?? "No property"}
            </p>
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground">Total</p>
                <p className="font-medium">
                  {formatCurrency(entry.total_amount, entry.currency)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Candidate</p>
                <p className="font-medium">
                  {formatCurrency(entry.candidate_reportable_amount, entry.currency)}
                </p>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href={`/app/expenses/${entry.id}`}>Edit</Link>
              </Button>
              <RecordActions endpoint={`/api/expenses/${entry.id}`} label="Archive" />
            </div>
          </div>
        ))}
      </div>

      <div className="hidden overflow-hidden rounded-lg border bg-background md:block">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/60 text-muted-foreground">
            <tr>
              <th className="p-3 font-medium">Date</th>
              <th className="p-3 font-medium">Vendor</th>
              <th className="p-3 font-medium">Property</th>
              <th className="p-3 font-medium">Category</th>
              <th className="p-3 font-medium">Total</th>
              <th className="p-3 font-medium">Candidate</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.id} className="border-t">
                <td className="p-3">{formatDate(entry.date)}</td>
                <td className="p-3 font-medium">{entry.vendor ?? "Unnamed"}</td>
                <td className="p-3">{entry.properties?.name ?? "No property"}</td>
                <td className="p-3">{entry.categories?.name ?? "No category"}</td>
                <td className="p-3">
                  {formatCurrency(entry.total_amount, entry.currency)}
                </td>
                <td className="p-3 font-medium">
                  {formatCurrency(entry.candidate_reportable_amount, entry.currency)}
                </td>
                <td className="p-3">{entry.status}</td>
                <td className="p-3">
                  <div className="flex gap-2">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/app/expenses/${entry.id}`}>Edit</Link>
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
    </>
  );
}
