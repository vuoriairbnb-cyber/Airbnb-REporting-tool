import { notFound } from "next/navigation";
import { ReceiptReviewForm } from "@/components/receipts/ReceiptReviewForm";
import { createClient } from "@/lib/supabase/server";
import { getCategories, getProperties, getReceipt } from "@/server/reporting/queries";

export default async function ReceiptDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [receipt, properties, categories] = await Promise.all([
    getReceipt(id),
    getProperties(),
    getCategories()
  ]);

  if (!receipt) notFound();

  const supabase = await createClient();
  const signedUrl =
    receipt.original_file_path || receipt.source_documents?.original_file_path
      ? await supabase.storage
          .from("receipt-originals")
          .createSignedUrl(
            receipt.original_file_path ??
              receipt.source_documents?.original_file_path ??
              "",
            60 * 10
          )
      : null;

  return (
    <div className="space-y-5">
      <div className="min-w-0">
        <p className="text-sm text-muted-foreground">Receipt file</p>
        <h1 className="mt-1 font-display text-2xl leading-tight md:text-3xl">
          Receipt details
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Review the receipt preview, AI extraction and linked reviewed expense.
        </p>
      </div>
      <ReceiptReviewForm
        receipt={receipt}
        properties={properties}
        categories={categories}
        fileUrl={signedUrl?.data?.signedUrl ?? null}
      />
    </div>
  );
}
