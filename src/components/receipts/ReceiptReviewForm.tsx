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
import type { CategoryRow, PropertyRow, ReceiptRow } from "@/server/reporting/types";

type NormalizedReceipt = {
  date?: string | null;
  vendor?: string | null;
  total_amount?: number | null;
  currency?: string | null;
  suggested_category?: string | null;
  confidence?: number | null;
  warnings?: string[];
};

export function ReceiptReviewForm({
  receipt,
  properties,
  categories,
  fileUrl
}: {
  receipt: ReceiptRow;
  properties: PropertyRow[];
  categories: CategoryRow[];
  fileUrl: string | null;
}) {
  const router = useRouter();
  const normalized = (receipt.ai_normalized_response ?? {}) as NormalizedReceipt;
  const expense = receipt.expense_entries;
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [totalAmount, setTotalAmount] = useState(
    String(expense?.total_amount ?? normalized.total_amount ?? "")
  );
  const [allocationMethod, setAllocationMethod] = useState<AllocationMethod>(
    (expense?.allocation_method as AllocationMethod | undefined) ?? "manual_percentage"
  );
  const [allocationPercentage, setAllocationPercentage] = useState(
    String(expense?.allocation_percentage ?? 100)
  );
  const currency = expense?.currency ?? normalized.currency ?? "EUR";

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
    const response = await fetch(`/api/receipts/${receipt.id}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        property_id: formData.get("property_id"),
        date: formData.get("date"),
        vendor: formData.get("vendor"),
        category_id: formData.get("category_id"),
        total_amount: formData.get("total_amount"),
        currency: formData.get("currency"),
        allocation_method: allocationMethod,
        allocation_percentage: normalizedPercentage,
        notes: formData.get("notes")
      })
    });

    setIsPending(false);

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.error ?? "Could not review receipt.");
      return;
    }

    router.push("/app/receipts");
    router.refresh();
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)]">
      <section className="rounded-lg border bg-background p-4">
        <h2 className="font-semibold">Receipt file</h2>
        <div className="mt-4 overflow-hidden rounded-md border bg-muted/40">
          {fileUrl && receipt.source_documents?.mime_type?.startsWith("image/") ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={fileUrl} alt="Receipt preview" className="h-auto w-full" />
          ) : fileUrl ? (
            <iframe src={fileUrl} title="Receipt preview" className="h-96 w-full" />
          ) : (
            <div className="grid min-h-56 place-items-center p-6 text-center text-sm text-muted-foreground">
              Preview is unavailable. The original file is still stored privately.
            </div>
          )}
        </div>
        <dl className="mt-4 grid gap-2 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">File</dt>
            <dd className="text-right">{receipt.source_documents?.original_file_name}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Status</dt>
            <dd className="capitalize">{receipt.status.replace("_", " ")}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">AI confidence</dt>
            <dd>{Math.round((receipt.ai_confidence ?? 0) * 100)}%</dd>
          </div>
        </dl>
      </section>

      <form
        onSubmit={handleSubmit}
        className="grid gap-4 rounded-lg border bg-background p-4"
      >
        <div>
          <h2 className="font-semibold">Extracted fields</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Mock extraction requires review before it becomes a reviewed expense.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Date">
            <input
              className={inputClassName}
              type="date"
              name="date"
              defaultValue={expense?.date ?? normalized.date ?? ""}
            />
          </Field>
          <Field label="Property">
            <select
              className={selectClassName}
              name="property_id"
              defaultValue={
                expense?.property_id ?? receipt.source_documents?.property_id ?? ""
              }
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
              defaultValue={expense?.vendor ?? normalized.vendor ?? ""}
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

        {normalized.warnings?.length ? (
          <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            {normalized.warnings.join(" ")}
          </div>
        ) : null}
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : "Save as reviewed expense"}
        </Button>
      </form>
    </div>
  );
}
