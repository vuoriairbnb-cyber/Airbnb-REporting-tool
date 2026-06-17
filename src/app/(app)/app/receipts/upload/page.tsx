import { PageHeader } from "@/components/layout/PageHeader";
import { ReceiptUploadForm } from "@/components/receipts/ReceiptUploadForm";
import { getProperties } from "@/server/reporting/queries";

export default async function UploadReceiptPage() {
  const properties = await getProperties();

  return (
    <>
      <PageHeader
        title="Upload receipt"
        description="Upload to private Supabase Storage and run mock extraction."
      />
      <ReceiptUploadForm properties={properties} />
    </>
  );
}
