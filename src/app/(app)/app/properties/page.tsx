import { Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/PageHeader";

export default function PropertiesPage() {
  return (
    <>
      <PageHeader title="Properties" description="Manage rental units used for income, expenses and reports." />
      <Button>
        <Building2 className="h-4 w-4" />
        Add property
      </Button>
    </>
  );
}
