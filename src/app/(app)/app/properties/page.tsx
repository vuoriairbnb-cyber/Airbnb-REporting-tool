import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PropertyList } from "@/components/properties/PropertyList";
import { getProperties } from "@/server/reporting/queries";

export default async function PropertiesPage() {
  const properties = await getProperties();

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            {properties.length} {properties.length === 1 ? "property" : "properties"}
          </p>
          <h1 className="mt-1 font-display text-2xl leading-tight md:text-3xl">
            Properties
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Manage rental units used for income, expenses, default allocation and
            reporting preparation.
          </p>
        </div>
        <Button asChild>
          <Link href="/app/properties/new">
            <Plus className="h-4 w-4" />
            Add property
          </Link>
        </Button>
      </div>
      <PropertyList properties={properties} />
    </div>
  );
}
