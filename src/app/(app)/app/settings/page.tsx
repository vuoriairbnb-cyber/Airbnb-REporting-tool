import { PageHeader } from "@/components/layout/PageHeader";
import { DISCLAIMER_TEXT } from "@/lib/constants/disclaimer";

export default function SettingsPage() {
  return (
    <>
      <PageHeader title="Settings" description="Billing, categories, AI consent, mobile install and disclaimers." />
      <div className="rounded-lg border bg-background p-4 text-sm text-muted-foreground">
        {DISCLAIMER_TEXT}
      </div>
    </>
  );
}
