import Link from "next/link";
import { AlertTriangle, FileText, ReceiptText, Sparkles } from "lucide-react";
import { Pill } from "@/components/app/primitives";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/format";
import type { ReceiptRow, ReceiptStatus } from "@/server/reporting/types";

function statusLabel(status: ReceiptStatus) {
  const labels: Record<ReceiptStatus, string> = {
    archived: "Archived",
    failed: "Failed",
    needs_review: "Needs review",
    processing: "Processing",
    reviewed: "Reviewed",
    uploaded: "Uploaded"
  };

  return labels[status];
}

function statusTone(status: ReceiptStatus) {
  const tones: Record<ReceiptStatus, string> = {
    archived: "bg-muted text-muted-foreground",
    failed: "bg-destructive/15 text-destructive",
    needs_review: "bg-warm/20 text-warm-foreground",
    processing: "bg-primary/10 text-primary",
    reviewed: "bg-success/15 text-success",
    uploaded: "bg-muted text-muted-foreground"
  };

  return tones[status];
}

function getConfidence(receipt: ReceiptRow) {
  if (receipt.ai_confidence === null || receipt.ai_confidence === undefined) {
    return null;
  }

  return `${Math.round(receipt.ai_confidence * 100)}%`;
}

function formatReceiptDate(expenseDate?: string | null, uploadedAt?: string | null) {
  if (expenseDate) return formatDate(expenseDate);
  if (!uploadedAt) return "No date";

  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric"
  }).format(new Date(uploadedAt));
}

export function ReceiptList({ receipts }: { receipts: ReceiptRow[] }) {
  if (!receipts.length) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-surface/60 p-10 text-center">
        <ReceiptText className="mx-auto h-8 w-8 text-primary" />
        <p className="mt-4 font-display text-lg">No receipts yet</p>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
          Upload your first receipt and complete receipt review before saving a reviewed
          expense.
        </p>
        <Button asChild className="mt-5">
          <Link href="/app/receipts/upload">Upload receipt</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {receipts.map((receipt) => {
        const expense = receipt.expense_entries;
        const sourceDocument = receipt.source_documents;
        const confidence = getConfidence(receipt);
        const title = expense?.vendor ?? sourceDocument?.original_file_name ?? "Receipt";
        const propertyName =
          expense?.properties?.name ?? sourceDocument?.properties?.name ?? "No property";
        const categoryName = expense?.categories?.name ?? "No category";
        const totalAmount = Number(expense?.total_amount ?? 0);
        const candidateAmount = Number(expense?.candidate_reportable_amount ?? 0);

        return (
          <Link
            key={receipt.id}
            href={
              receipt.status === "reviewed"
                ? `/app/receipts/${receipt.id}`
                : `/app/receipts/${receipt.id}/review`
            }
            className="grid grid-cols-[64px_minmax(0,1fr)] gap-3 rounded-2xl border border-border bg-card p-3 shadow-card transition hover:border-primary/40 hover:bg-muted/30 sm:grid-cols-[64px_minmax(0,1fr)_auto] sm:items-center"
          >
            <div className="grid h-16 w-16 place-items-center rounded-xl bg-surface text-primary">
              {receipt.status === "failed" ? (
                <AlertTriangle className="h-6 w-6" />
              ) : (
                <FileText className="h-6 w-6" />
              )}
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate font-medium">{title}</p>
                <Pill tone={statusTone(receipt.status)}>
                  {statusLabel(receipt.status)}
                </Pill>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {formatReceiptDate(expense?.date, sourceDocument?.created_at)} /{" "}
                {propertyName}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {confidence ? (
                  <Pill tone="bg-primary/10 text-primary">
                    <Sparkles className="mr-1 h-3 w-3" />
                    AI {confidence}
                  </Pill>
                ) : null}
                <Pill>{categoryName}</Pill>
                {receipt.expense_entry_id ? (
                  <Pill tone="bg-success/15 text-success">Receipt-linked expense</Pill>
                ) : null}
              </div>
            </div>

            <div className="col-span-2 rounded-xl bg-surface/70 px-3 py-2 text-left sm:col-span-1 sm:bg-transparent sm:p-0 sm:text-right">
              <p className="font-medium">
                {formatCurrency(totalAmount, expense?.currency)}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Candidate {formatCurrency(candidateAmount, expense?.currency)}
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
