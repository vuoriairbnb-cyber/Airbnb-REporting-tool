import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
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
    <>
      <PageHeader
        title="Receipt details"
        description="Receipt preview and extracted data."
      />
      <ReceiptReviewForm
        receipt={receipt}
        properties={properties}
        categories={categories}
        fileUrl={signedUrl?.data?.signedUrl ?? null}
      />
    </>
  );
}
