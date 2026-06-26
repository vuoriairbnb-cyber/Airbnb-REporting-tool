import Link from "next/link";
import { Building2, MapPin, Percent } from "lucide-react";
import { Pill } from "@/components/app/primitives";
import { Button } from "@/components/ui/button";
import { RecordActions } from "@/components/reporting/RecordActions";
import type { PropertyRow } from "@/server/reporting/types";

function getLocation(property: PropertyRow) {
  return (
    [property.city, property.country].filter(Boolean).join(", ") ||
    property.address ||
    "No address"
  );
}

function formatAllocationMethod(method: string | null) {
  if (method === "full_rental_use") return "Full rental use";
  if (method === "manual_percentage") return "Manual percentage";
  if (method === "excluded") return "Excluded";

  return "Default allocation";
}

function statusTone(isActive: boolean) {
  return isActive ? "bg-success/15 text-success" : "bg-muted text-muted-foreground";
}

export function PropertyList({ properties }: { properties: PropertyRow[] }) {
  if (properties.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-surface/60 p-10 text-center">
        <Building2 className="mx-auto h-8 w-8 text-primary" />
        <p className="mt-4 font-display text-lg">No properties yet</p>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
          Create your first rental property before adding income, expenses and default
          allocation details.
        </p>
        <Button asChild className="mt-5">
          <Link href="/app/properties/new">Add property</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {properties.map((property) => {
        const allocationPercentage = property.default_allocation_percentage ?? 100;

        return (
          <article
            key={property.id}
            className="overflow-hidden rounded-2xl border border-border bg-card shadow-card"
          >
            <div className="grid h-32 place-items-center bg-gradient-to-br from-primary/15 via-accent to-warm/10">
              <Building2 className="h-10 w-10 text-primary" />
            </div>
            <div className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate font-display text-lg">{property.name}</h2>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    {getLocation(property)}
                  </p>
                </div>
                <Pill tone={statusTone(property.is_active)}>
                  {property.is_active ? "Active" : "Inactive"}
                </Pill>
              </div>

              <div className="mt-4 grid gap-3 border-t border-border pt-4 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Currency</span>
                  <span className="font-medium">{property.currency}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Default allocation</span>
                  <span className="inline-flex items-center gap-1 text-right text-foreground">
                    <Percent className="h-3.5 w-3.5 text-primary" />
                    {allocationPercentage}% default
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatAllocationMethod(property.default_allocation_method)}
                </p>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link href={`/app/properties/${property.id}`}>Manage</Link>
                </Button>
                {property.is_active ? (
                  <RecordActions
                    endpoint={`/api/properties/${property.id}`}
                    label="Deactivate"
                  />
                ) : null}
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
