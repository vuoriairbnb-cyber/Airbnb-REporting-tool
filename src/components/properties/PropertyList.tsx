import Link from "next/link";
import { Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/state/EmptyState";
import { RecordActions } from "@/components/reporting/RecordActions";
import type { PropertyRow } from "@/server/reporting/types";

export function PropertyList({ properties }: { properties: PropertyRow[] }) {
  if (properties.length === 0) {
    return (
      <EmptyState
        icon={Building2}
        title="No properties yet"
        description="Create your first rental property before adding income and expenses."
      />
    );
  }

  return (
    <>
      <div className="grid gap-3 md:hidden">
        {properties.map((property) => (
          <div key={property.id} className="rounded-lg border bg-background p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-semibold">{property.name}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {[property.city, property.country].filter(Boolean).join(", ") ||
                    "No address"}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {property.currency} · {property.is_active ? "Active" : "Inactive"}
                </p>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href={`/app/properties/${property.id}`}>Edit</Link>
              </Button>
              {property.is_active ? (
                <RecordActions
                  endpoint={`/api/properties/${property.id}`}
                  label="Deactivate"
                />
              ) : null}
            </div>
          </div>
        ))}
      </div>

      <div className="hidden overflow-hidden rounded-lg border bg-background md:block">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/60 text-muted-foreground">
            <tr>
              <th className="p-3 font-medium">Name</th>
              <th className="p-3 font-medium">Location</th>
              <th className="p-3 font-medium">Currency</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {properties.map((property) => (
              <tr key={property.id} className="border-t">
                <td className="p-3 font-medium">{property.name}</td>
                <td className="p-3 text-muted-foreground">
                  {[property.city, property.country].filter(Boolean).join(", ") ||
                    "No address"}
                </td>
                <td className="p-3">{property.currency}</td>
                <td className="p-3">{property.is_active ? "Active" : "Inactive"}</td>
                <td className="p-3">
                  <div className="flex gap-2">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/app/properties/${property.id}`}>Edit</Link>
                    </Button>
                    {property.is_active ? (
                      <RecordActions
                        endpoint={`/api/properties/${property.id}`}
                        label="Deactivate"
                      />
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
