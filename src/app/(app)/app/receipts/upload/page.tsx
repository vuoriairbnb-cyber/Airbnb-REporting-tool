import { PageHeader } from "@/components/layout/PageHeader";
import { ReceiptUploadForm } from "@/components/receipts/ReceiptUploadForm";
import { getI18n } from "@/lib/i18n/server";
import { getProperties } from "@/server/reporting/queries";

export default async function UploadReceiptPage() {
  const [properties, { t }] = await Promise.all([getProperties(), getI18n()]);

  return (
    <>
      <PageHeader
        title={t.receipts.uploadTitle}
        description={t.receipts.uploadDescription}
      />
      <ReceiptUploadForm
        properties={properties}
        labels={{ receipts: t.receipts, common: t.common }}
      />
    </>
  );
}
