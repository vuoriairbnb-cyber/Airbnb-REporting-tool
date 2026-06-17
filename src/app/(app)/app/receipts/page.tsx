import Link from "next/link";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/PageHeader";
import { ReceiptList } from "@/components/receipts/ReceiptList";
import { getReceipts } from "@/server/reporting/queries";

export default async function ReceiptsPage() {
  const receipts = await getReceipts();

  return (
    <>
      <PageHeader
        title="Receipts"
        description="Upload receipts, run AI extraction and review drafts."
      />
      <div className="mb-4">
        <Button asChild>
          <Link href="/app/receipts/upload">
            <Upload className="h-4 w-4" />
            Upload receipt
          </Link>
        </Button>
      </div>
      <ReceiptList receipts={receipts} />
    </>
  );
}
