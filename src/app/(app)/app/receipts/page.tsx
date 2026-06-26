import Link from "next/link";
import { Camera, Sparkles, Upload } from "lucide-react";
import { DashboardCard } from "@/components/app/primitives";
import { Button } from "@/components/ui/button";
import { ReceiptList } from "@/components/receipts/ReceiptList";
import { getReceipts } from "@/server/reporting/queries";

export default async function ReceiptsPage() {
  const receipts = await getReceipts();
  const summary = receipts.reduce(
    (totals, receipt) => {
      totals.total += 1;
      if (receipt.status === "needs_review") totals.needsReview += 1;
      if (receipt.status === "reviewed") totals.reviewed += 1;
      if (receipt.status === "failed") totals.failed += 1;
      return totals;
    },
    { total: 0, needsReview: 0, reviewed: 0, failed: 0 }
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 sm:flex sm:flex-wrap sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">
            {receipts.length} {receipts.length === 1 ? "receipt" : "receipts"}
          </p>
          <h1 className="mt-1 font-display text-2xl leading-tight md:text-3xl">
            Receipts
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Upload receipts, run AI extraction and complete receipt review before creating
            a reviewed expense.
          </p>
        </div>
        <Button asChild>
          <Link href="/app/receipts/upload">
            <Upload className="h-4 w-4" />
            Upload receipt
          </Link>
        </Button>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
        <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <p className="font-display text-lg">Upload a receipt</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Pick a receipt image or PDF, then review the AI extraction before it becomes
              a reviewed expense.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link href="/app/receipts/upload">
                <Camera className="h-4 w-4" />
                Take photo
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/app/receipts/upload">
                <Upload className="h-4 w-4" />
                Upload
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <Link
        href="/app/receipts/upload"
        className="block rounded-2xl border-2 border-dashed border-border bg-surface/60 p-8 text-center transition hover:border-primary/50 hover:bg-primary/5"
      >
        <Sparkles className="mx-auto h-7 w-7 text-primary" />
        <p className="mt-3 text-sm font-medium">Drop receipts here in the upload flow</p>
        <p className="mt-1 text-xs text-muted-foreground">
          JPG, PNG, WEBP or PDF / up to 10 MB
        </p>
      </Link>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardCard label="All receipts" value={summary.total} hint="Uploaded files" />
        <DashboardCard
          label="Needs review"
          value={summary.needsReview}
          hint="AI extraction awaiting review"
          tone="warm"
        />
        <DashboardCard
          label="Reviewed"
          value={summary.reviewed}
          hint="Saved as reviewed expenses"
          tone="primary"
        />
        <DashboardCard label="Failed" value={summary.failed} hint="Requires attention" />
      </div>

      <ReceiptList receipts={receipts} />
    </div>
  );
}
