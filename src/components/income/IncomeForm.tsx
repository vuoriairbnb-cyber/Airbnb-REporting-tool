"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Field,
  inputClassName,
  selectClassName,
  textareaClassName
} from "@/components/forms/Field";
import type { IncomeEntryRow, PropertyRow } from "@/server/reporting/types";

export function IncomeForm({
  income,
  properties
}: {
  income?: IncomeEntryRow;
  properties: PropertyRow[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsPending(true);

    const formData = new FormData(event.currentTarget);
    const payload = {
      property_id: formData.get("property_id"),
      date: formData.get("date"),
      platform: formData.get("platform"),
      gross_amount: formData.get("gross_amount"),
      platform_fee: formData.get("platform_fee"),
      cleaning_fee: formData.get("cleaning_fee"),
      net_payout: formData.get("net_payout"),
      currency: formData.get("currency"),
      notes: formData.get("notes")
    };

    const response = await fetch(income ? `/api/income/${income.id}` : "/api/income", {
      method: income ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    setIsPending(false);

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.error ?? "Could not save income.");
      return;
    }

    router.push("/app/income");
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-4 rounded-2xl border border-border bg-card p-5 shadow-card"
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Date">
          <input
            className={inputClassName}
            type="date"
            name="date"
            defaultValue={income?.date}
            required
          />
        </Field>
        <Field label="Property">
          <select
            className={selectClassName}
            name="property_id"
            defaultValue={income?.property_id ?? ""}
          >
            <option value="">No property</option>
            {properties.map((property) => (
              <option key={property.id} value={property.id}>
                {property.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Platform">
          <input
            className={inputClassName}
            name="platform"
            defaultValue={income?.platform ?? "Airbnb"}
            required
          />
        </Field>
        <Field label="Currency">
          <input
            className={inputClassName}
            name="currency"
            defaultValue={income?.currency ?? "EUR"}
            maxLength={3}
          />
        </Field>
        <Field label="Gross amount">
          <input
            className={inputClassName}
            type="number"
            step="0.01"
            name="gross_amount"
            defaultValue={income?.gross_amount ?? ""}
          />
        </Field>
        <Field label="Platform fee">
          <input
            className={inputClassName}
            type="number"
            step="0.01"
            name="platform_fee"
            defaultValue={income?.platform_fee ?? ""}
          />
        </Field>
        <Field label="Cleaning fee">
          <input
            className={inputClassName}
            type="number"
            step="0.01"
            name="cleaning_fee"
            defaultValue={income?.cleaning_fee ?? ""}
          />
        </Field>
        <Field label="Net payout">
          <input
            className={inputClassName}
            type="number"
            step="0.01"
            name="net_payout"
            defaultValue={income?.net_payout ?? ""}
          />
        </Field>
      </div>
      <Field label="Notes">
        <textarea
          className={textareaClassName}
          name="notes"
          defaultValue={income?.notes ?? ""}
        />
      </Field>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button type="submit" disabled={isPending}>
        {income ? "Save income" : "Create income"}
      </Button>
    </form>
  );
}
