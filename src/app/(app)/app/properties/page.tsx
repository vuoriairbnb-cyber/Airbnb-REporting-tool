import Link from "next/link";
import { Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/PageHeader";
import { PropertyList } from "@/components/properties/PropertyList";
import { getProperties } from "@/server/reporting/queries";

export default async function PropertiesPage() {
  const properties = await getProperties();

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          title="Properties"
          description="Manage rental units used for income, expenses and reports."
        />
        <Button asChild>
          <Link href="/app/properties/new">
            <Building2 className="h-4 w-4" />
            Add property
          </Link>
        </Button>
      </div>
      <PropertyList properties={properties} />
    </>
  );
}
