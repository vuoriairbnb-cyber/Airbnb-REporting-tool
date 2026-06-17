import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/format";
import type { ReceiptRow } from "@/server/reporting/types";

export function ReceiptList({ receipts }: { receipts: ReceiptRow[] }) {
  if (!receipts.length) {
    return (
      <div className="flex min-h-48 flex-col items-center justify-center rounded-lg border bg-background p-6 text-center">
        <h2 className="text-base font-semibold">No receipts yet</h2>
        <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
          Upload your first receipt and review the mock extraction.
        </p>
        <Button asChild className="mt-5">
          <Link href="/app/receipts/upload">Upload receipt</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {receipts.map((receipt) => {
        const expense = receipt.expense_entries;

        return (
          <Link
            key={receipt.id}
            href={
              receipt.status === "reviewed"
                ? `/app/receipts/${receipt.id}`
                : `/app/receipts/${receipt.id}/review`
            }
            className="grid gap-2 rounded-lg border bg-background p-4 transition hover:border-primary/40 md:grid-cols-[1fr_auto] md:items-center"
          >
            <div>
              <p className="font-medium">
                {expense?.vendor ??
                  receipt.source_documents?.original_file_name ??
                  "Receipt"}
              </p>
              <p className="text-sm text-muted-foreground">
                {expense?.date ?? "No date"} ·{" "}
                {receipt.source_documents?.properties?.name ?? "No property"} ·{" "}
                <span className="capitalize">{receipt.status.replace("_", " ")}</span>
              </p>
            </div>
            <div className="text-left md:text-right">
              <p className="font-semibold">
                {formatCurrency(Number(expense?.total_amount ?? 0), expense?.currency)}
              </p>
              <p className="text-sm text-muted-foreground">
                Candidate{" "}
                {formatCurrency(
                  Number(expense?.candidate_reportable_amount ?? 0),
                  expense?.currency
                )}
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
