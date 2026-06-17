import { FileArchive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/PageHeader";
import { DISCLAIMER_TEXT } from "@/lib/constants/disclaimer";

export default function ReportsPage() {
  return (
    <>
      <PageHeader title="Reports" description="Generate CSV, PDF and ZIP files for tax-filing preparation." />
      <div className="mb-5 rounded-lg border bg-background p-4 text-sm text-muted-foreground">
        {DISCLAIMER_TEXT}
      </div>
      <Button>
        <FileArchive className="h-4 w-4" />
        Generate report
      </Button>
    </>
  );
}
