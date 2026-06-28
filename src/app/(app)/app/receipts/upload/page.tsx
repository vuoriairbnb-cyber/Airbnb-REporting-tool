import { PageHeader } from "@/components/layout/PageHeader";
import { ReceiptUploadForm } from "@/components/receipts/ReceiptUploadForm";
import { getProperties } from "@/server/reporting/queries";

export default async function UploadReceiptPage() {
  const properties = await getProperties();

  return (
    <>
      <PageHeader
        title="Upload receipt"
        description="Optimize image receipts when possible, upload to private storage and run AI extraction."
      />
      <ReceiptUploadForm properties={properties} />
    </>
  );
}
