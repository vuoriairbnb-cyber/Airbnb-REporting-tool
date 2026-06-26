"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, inputClassName, selectClassName } from "@/components/forms/Field";
import type { PropertyRow } from "@/server/reporting/types";

export function PropertyForm({ property }: { property?: PropertyRow }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsPending(true);

    const formData = new FormData(event.currentTarget);
    const payload = {
      name: formData.get("name"),
      address: formData.get("address"),
      city: formData.get("city"),
      country: formData.get("country"),
      currency: formData.get("currency"),
      default_allocation_method: formData.get("default_allocation_method"),
      default_allocation_percentage: formData.get("default_allocation_percentage"),
      is_active: formData.get("is_active") === "on"
    };

    const response = await fetch(
      property ? `/api/properties/${property.id}` : "/api/properties",
      {
        method: property ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }
    );

    setIsPending(false);

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.error ?? "Could not save property.");
      return;
    }

    router.push("/app/properties");
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-4 rounded-2xl border border-border bg-card p-5 shadow-card"
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Property name">
          <input
            className={inputClassName}
            name="name"
            defaultValue={property?.name}
            required
          />
        </Field>
        <Field label="Country">
          <input
            className={inputClassName}
            name="country"
            defaultValue={property?.country ?? "FI"}
            required
          />
        </Field>
        <Field label="Address">
          <input
            className={inputClassName}
            name="address"
            defaultValue={property?.address ?? ""}
          />
        </Field>
        <Field label="City">
          <input
            className={inputClassName}
            name="city"
            defaultValue={property?.city ?? ""}
          />
        </Field>
        <Field label="Currency">
          <input
            className={inputClassName}
            name="currency"
            defaultValue={property?.currency ?? "EUR"}
            maxLength={3}
            required
          />
        </Field>
        <Field label="Default allocation method">
          <select
            className={selectClassName}
            name="default_allocation_method"
            defaultValue={property?.default_allocation_method ?? "full_rental_use"}
          >
            <option value="full_rental_use">Full rental use</option>
            <option value="manual_percentage">Manual percentage</option>
            <option value="excluded">Excluded</option>
          </select>
        </Field>
        <Field label="Default allocation %">
          <input
            className={inputClassName}
            type="number"
            name="default_allocation_percentage"
            min="0"
            max="100"
            step="0.01"
            defaultValue={property?.default_allocation_percentage ?? 100}
          />
        </Field>
        <label className="flex items-center gap-2 self-end text-sm">
          <input
            name="is_active"
            type="checkbox"
            defaultChecked={property?.is_active ?? true}
          />
          Active
        </label>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button type="submit" disabled={isPending}>
        {property ? "Save property" : "Create property"}
      </Button>
    </form>
  );
}
