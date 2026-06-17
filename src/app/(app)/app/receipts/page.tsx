import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/PageHeader";

export default function ReceiptsPage() {
  return (
    <>
      <PageHeader title="Receipts" description="Upload receipts, run AI extraction and review drafts." />
      <Button>
        <Upload className="h-4 w-4" />
        Upload receipt
      </Button>
    </>
  );
}
