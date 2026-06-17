"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  calculateCandidateReportableAmount,
  normalizeAllocationPercentage,
  type AllocationMethod
} from "@/lib/calculations/allocation";
import {
  Field,
  inputClassName,
  selectClassName,
  textareaClassName
} from "@/components/forms/Field";
import { formatCurrency } from "@/lib/format";
import type { CategoryRow, ExpenseEntryRow, PropertyRow } from "@/server/reporting/types";

export function ExpenseForm({
  expense,
  properties,
  categories
}: {
  expense?: ExpenseEntryRow;
  properties: PropertyRow[];
  categories: CategoryRow[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [totalAmount, setTotalAmount] = useState(String(expense?.total_amount ?? ""));
  const [allocationMethod, setAllocationMethod] = useState<AllocationMethod>(
    (expense?.allocation_method as AllocationMethod | undefined) ?? "full_rental_use"
  );
  const [allocationPercentage, setAllocationPercentage] = useState(
    String(expense?.allocation_percentage ?? 100)
  );
  const currency = expense?.currency ?? "EUR";

  const normalizedPercentage = useMemo(
    () =>
      normalizeAllocationPercentage(allocationMethod, Number(allocationPercentage || 0)),
    [allocationMethod, allocationPercentage]
  );
  const candidateAmount = useMemo(
    () =>
      calculateCandidateReportableAmount(Number(totalAmount || 0), normalizedPercentage),
    [totalAmount, normalizedPercentage]
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsPending(true);

    const formData = new FormData(event.currentTarget);
    const payload = {
      property_id: formData.get("property_id"),
      date: formData.get("date"),
      vendor: formData.get("vendor"),
      category_id: formData.get("category_id"),
      total_amount: formData.get("total_amount"),
      currency: formData.get("currency"),
      allocation_method: allocationMethod,
      allocation_percentage: normalizedPercentage,
      notes: formData.get("notes")
    };

    const response = await fetch(
      expense ? `/api/expenses/${expense.id}` : "/api/expenses",
      {
        method: expense ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }
    );

    setIsPending(false);

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.error ?? "Could not save expense.");
      return;
    }

    router.push("/app/expenses");
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-4 rounded-lg border bg-background p-4"
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Date">
          <input
            className={inputClassName}
            type="date"
            name="date"
            defaultValue={expense?.date ?? ""}
          />
        </Field>
        <Field label="Property">
          <select
            className={selectClassName}
            name="property_id"
            defaultValue={expense?.property_id ?? ""}
          >
            <option value="">No property</option>
            {properties.map((property) => (
              <option key={property.id} value={property.id}>
                {property.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Vendor">
          <input
            className={inputClassName}
            name="vendor"
            defaultValue={expense?.vendor ?? ""}
          />
        </Field>
        <Field label="Category">
          <select
            className={selectClassName}
            name="category_id"
            defaultValue={expense?.category_id ?? ""}
          >
            <option value="">No category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Total amount">
          <input
            className={inputClassName}
            type="number"
            step="0.01"
            name="total_amount"
            value={totalAmount}
            onChange={(event) => setTotalAmount(event.target.value)}
            required
          />
        </Field>
        <Field label="Currency">
          <input
            className={inputClassName}
            name="currency"
            defaultValue={currency}
            maxLength={3}
          />
        </Field>
        <Field label="Allocation method">
          <select
            className={selectClassName}
            name="allocation_method"
            value={allocationMethod}
            onChange={(event) =>
              setAllocationMethod(event.target.value as AllocationMethod)
            }
          >
            <option value="full_rental_use">Full rental use</option>
            <option value="manual_percentage">Manual percentage</option>
            <option value="excluded">Excluded</option>
          </select>
        </Field>
        <Field label="Allocation %">
          <input
            className={inputClassName}
            type="number"
            min="0"
            max="100"
            step="0.01"
            name="allocation_percentage"
            value={normalizedPercentage}
            disabled={allocationMethod !== "manual_percentage"}
            onChange={(event) => setAllocationPercentage(event.target.value)}
          />
        </Field>
      </div>
      <div className="rounded-md border bg-muted/40 p-4">
        <p className="text-sm text-muted-foreground">Candidate reportable amount</p>
        <p className="mt-2 text-2xl font-semibold">
          {formatCurrency(candidateAmount, currency)}
        </p>
      </div>
      <Field label="Notes">
        <textarea
          className={textareaClassName}
          name="notes"
          defaultValue={expense?.notes ?? ""}
        />
      </Field>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button type="submit" disabled={isPending}>
        {expense ? "Save expense" : "Create expense"}
      </Button>
    </form>
  );
}
