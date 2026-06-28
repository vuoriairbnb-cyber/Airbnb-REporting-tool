"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, FileText, Save, Sparkles } from "lucide-react";
import { Pill } from "@/components/app/primitives";
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
import { cn } from "@/lib/utils";
import type { CategoryRow, PropertyRow, ReceiptRow } from "@/server/reporting/types";

type NormalizedReceipt = {
  date?: string | null;
  vendor?: string | null;
  total_amount?: number | null;
  tax_amount?: number | null;
  currency?: string | null;
  suggested_category?: string | null;
  items?: unknown;
  confidence?: number | null;
  warnings?: string[];
};

type ReviewLineItem = {
  id: string;
  description: string | null;
  quantity: number | null;
  unit_amount: number | null;
  line_amount: number | null;
  tax_amount: number | null;
  amount: number | null;
  category_hint: string | null;
  suggested_category_name: string | null;
  suggested_category_confidence: number | null;
  confidence: number | null;
  ai_suggested_category_name: string | null;
  ai_suggested_category_id: string | null;
  ai_category_confidence: number | null;
  user_selected_category_id: string | null;
  allocation_percentage: number;
  candidate_reportable_amount: number | null;
};

const reviewInputClassName = cn(
  inputClassName,
  "rounded-lg border-border bg-card focus:border-primary focus:ring-primary/20"
);
const reviewSelectClassName = cn(
  selectClassName,
  "rounded-lg border-border bg-card focus:border-primary focus:ring-primary/20"
);
const reviewTextareaClassName = cn(
  textareaClassName,
  "rounded-lg border-border bg-card focus:border-primary focus:ring-primary/20"
);

function confidenceLabel(confidence?: number | null) {
  if (confidence === null || confidence === undefined) return "No confidence";

  return `Confidence ${Math.round(confidence * 100)}%`;
}

function fileTypeLabel(mimeType?: string | null) {
  if (!mimeType) return "Receipt file";
  if (mimeType === "application/pdf") return "PDF receipt";
  if (mimeType.startsWith("image/")) return "Image receipt";

  return mimeType;
}

function numberOrNull(value: unknown) {
  const number = Number(value);

  return Number.isFinite(number) ? number : null;
}

function stringOrNull(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : null;
}

function readLineItems(value: unknown): ReviewLineItem[] {
  if (!Array.isArray(value)) return [];

  return value.map((item, index) => {
    const record =
      item && typeof item === "object" ? (item as Record<string, unknown>) : {};
    const lineAmount = numberOrNull(record.line_amount ?? record.amount);
    const allocationPercentage = normalizeAllocationPercentage(
      "manual_percentage",
      numberOrNull(record.allocation_percentage) ?? 100
    );

    return {
      id: stringOrNull(record.id) ?? `item-${index + 1}`,
      description: stringOrNull(record.description),
      quantity: numberOrNull(record.quantity),
      unit_amount: numberOrNull(record.unit_amount),
      line_amount: lineAmount,
      tax_amount: numberOrNull(record.tax_amount),
      amount: lineAmount,
      category_hint: stringOrNull(record.category_hint),
      suggested_category_name: stringOrNull(record.suggested_category_name),
      suggested_category_confidence: numberOrNull(record.suggested_category_confidence),
      confidence: numberOrNull(record.confidence),
      ai_suggested_category_name:
        stringOrNull(record.ai_suggested_category_name) ??
        stringOrNull(record.suggested_category_name) ??
        stringOrNull(record.category_hint),
      ai_suggested_category_id: stringOrNull(record.ai_suggested_category_id),
      ai_category_confidence:
        numberOrNull(record.ai_category_confidence) ??
        numberOrNull(record.suggested_category_confidence),
      user_selected_category_id:
        stringOrNull(record.user_selected_category_id) ??
        stringOrNull(record.ai_suggested_category_id),
      allocation_percentage: allocationPercentage,
      candidate_reportable_amount:
        lineAmount === null
          ? null
          : calculateCandidateReportableAmount(lineAmount, allocationPercentage)
    };
  });
}

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
  const sourceDocument = receipt.source_documents;
  const isMissingLinkedExpense = !expense?.id;
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [isReparsing, setIsReparsing] = useState(false);
  const [totalAmount, setTotalAmount] = useState(
    String(expense?.total_amount ?? normalized.total_amount ?? "")
  );
  const [currencyValue, setCurrencyValue] = useState(
    expense?.currency ?? normalized.currency ?? "EUR"
  );
  const [allocationMethod, setAllocationMethod] = useState<AllocationMethod>(
    (expense?.allocation_method as AllocationMethod | undefined) ?? "manual_percentage"
  );
  const [allocationPercentage, setAllocationPercentage] = useState(
    String(expense?.allocation_percentage ?? 100)
  );
  const [lineItems, setLineItems] = useState<ReviewLineItem[]>(() => {
    const expenseItems = readLineItems(expense?.items);

    return expenseItems.length ? expenseItems : readLineItems(normalized.items);
  });
  const confidence = receipt.ai_confidence ?? normalized.confidence ?? null;

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

  function updateLineItem(index: number, updates: Partial<ReviewLineItem>) {
    setLineItems((current) =>
      current.map((item, itemIndex) => {
        if (itemIndex !== index) return item;

        const next = { ...item, ...updates };
        const allocation = normalizeAllocationPercentage(
          "manual_percentage",
          Number(next.allocation_percentage || 0)
        );

        return {
          ...next,
          allocation_percentage: allocation,
          candidate_reportable_amount:
            next.line_amount === null || next.line_amount === undefined
              ? null
              : calculateCandidateReportableAmount(next.line_amount, allocation)
        };
      })
    );
  }

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
        notes: formData.get("notes"),
        line_items: lineItems
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

  async function handleAccurateScan() {
    setError(null);
    setIsReparsing(true);

    const response = await fetch("/api/ai/reparse-receipt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ receiptId: receipt.id })
    });

    setIsReparsing(false);

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.error ?? "Could not run Plus scan.");
      return;
    }

    router.refresh();
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
      <div className="border-b border-border bg-surface/60 px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="font-display text-lg">Receipt review</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {sourceDocument?.original_file_name ?? "Private receipt file"} /{" "}
              {fileTypeLabel(sourceDocument?.mime_type)}
            </p>
          </div>
          <Pill tone="bg-warm/20 text-warm-foreground">
            <Sparkles className="mr-1 h-3 w-3" />
            {confidenceLabel(confidence)}
          </Pill>
        </div>
      </div>

      <div className="grid gap-5 p-5 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.15fr)]">
        <section className="rounded-xl border border-dashed border-border bg-surface/50 p-4">
          <div className="overflow-hidden rounded-lg border border-border bg-card shadow-soft">
            {fileUrl && sourceDocument?.mime_type?.startsWith("image/") ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={fileUrl} alt="Receipt preview" className="h-auto w-full" />
            ) : fileUrl ? (
              <iframe src={fileUrl} title="Receipt preview" className="h-96 w-full" />
            ) : (
              <div className="grid min-h-72 place-items-center p-6 text-center">
                <div>
                  <FileText className="mx-auto h-9 w-9 text-primary" />
                  <p className="mt-3 font-medium">Preview unavailable</p>
                  <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                    The original file is still stored privately.
                  </p>
                </div>
              </div>
            )}
          </div>

          <dl className="mt-4 grid gap-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">File</dt>
              <dd className="truncate text-right">
                {sourceDocument?.original_file_name ?? "Receipt"}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Status</dt>
              <dd className="capitalize">{receipt.status.replace("_", " ")}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">AI provider</dt>
              <dd>{receipt.ai_provider ?? "Mock"}</dd>
            </div>
          </dl>
        </section>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isMissingLinkedExpense ? (
            <div className="rounded-xl border border-warm/30 bg-warm/10 p-3 text-sm">
              <div className="flex gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warm" />
                <div>
                  <p className="font-medium">Linked expense draft missing</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    This receipt cannot be saved as a reviewed expense until it has a
                    linked draft. Add the expense manually or upload the receipt again.
                  </p>
                  <Button asChild variant="outline" size="sm" className="mt-3">
                    <Link href="/app/expenses/new">Add expense manually</Link>
                  </Button>
                </div>
              </div>
            </div>
          ) : null}

          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-lg">Extracted fields</h2>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  AI extraction results must be reviewed before saving.
                </p>
              </div>
              <Pill tone="bg-primary/10 text-primary">AI extraction</Pill>
            </div>
            <div className="mt-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAccurateScan}
                disabled={isPending || isReparsing}
              >
                <Sparkles className="h-4 w-4" />
                {isReparsing ? "Running Plus scan..." : "Run Plus scan again"}
              </Button>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Field label="Date">
                <input
                  className={reviewInputClassName}
                  type="date"
                  name="date"
                  defaultValue={expense?.date ?? normalized.date ?? ""}
                />
              </Field>
              <Field label="Vendor">
                <input
                  className={reviewInputClassName}
                  name="vendor"
                  defaultValue={expense?.vendor ?? normalized.vendor ?? ""}
                />
              </Field>
              <Field label="Total amount">
                <input
                  className={reviewInputClassName}
                  type="number"
                  step="0.01"
                  name="total_amount"
                  value={totalAmount}
                  onChange={(event) => setTotalAmount(event.target.value)}
                  required
                />
              </Field>
              <Field label="VAT / tax">
                <input
                  className={cn(reviewInputClassName, "text-muted-foreground")}
                  value={normalized.tax_amount ?? ""}
                  readOnly
                  aria-describedby="tax-note"
                />
                <p id="tax-note" className="text-xs text-muted-foreground">
                  Shown from AI extraction; not stored as a separate expense field yet.
                </p>
              </Field>
              <Field label="Currency">
                <input
                  className={reviewInputClassName}
                  name="currency"
                  value={currencyValue}
                  maxLength={3}
                  onChange={(event) => setCurrencyValue(event.target.value)}
                />
              </Field>
              <Field label="Suggested category">
                <select
                  className={reviewSelectClassName}
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
                {normalized.suggested_category ? (
                  <p className="text-xs text-muted-foreground">
                    Suggested by AI: {normalized.suggested_category}
                  </p>
                ) : null}
              </Field>
            </div>
          </div>

          {lineItems.length ? (
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-lg">Line items</h2>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    Review each line item category before saving the expense.
                  </p>
                </div>
                <Pill tone="bg-primary/10 text-primary">Suggested by AI</Pill>
              </div>

              <div className="mt-4 space-y-3">
                {lineItems.map((item, index) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-border bg-surface/50 p-3"
                  >
                    <div className="grid gap-3 md:grid-cols-[minmax(0,1.4fr)_0.7fr_0.9fr_0.7fr_0.9fr]">
                      <Field label="Description">
                        <input
                          className={reviewInputClassName}
                          value={item.description ?? ""}
                          onChange={(event) =>
                            updateLineItem(index, {
                              description: event.target.value || null
                            })
                          }
                        />
                      </Field>
                      <Field label="Line amount">
                        <input
                          className={reviewInputClassName}
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.line_amount ?? ""}
                          onChange={(event) =>
                            updateLineItem(index, {
                              line_amount: numberOrNull(event.target.value),
                              amount: numberOrNull(event.target.value)
                            })
                          }
                        />
                      </Field>
                      <Field label="Reviewed category">
                        <select
                          className={reviewSelectClassName}
                          value={item.user_selected_category_id ?? ""}
                          onChange={(event) =>
                            updateLineItem(index, {
                              user_selected_category_id: event.target.value || null
                            })
                          }
                        >
                          <option value="">Choose category</option>
                          {categories.map((category) => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                      </Field>
                      <Field label="Allocation %">
                        <input
                          className={reviewInputClassName}
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={item.allocation_percentage}
                          onChange={(event) =>
                            updateLineItem(index, {
                              allocation_percentage: Number(event.target.value || 0)
                            })
                          }
                        />
                      </Field>
                      <div className="rounded-lg border border-primary/15 bg-primary/10 p-3">
                        <p className="text-xs uppercase text-primary">
                          Candidate reportable amount
                        </p>
                        <p className="mt-1 font-display text-lg text-primary">
                          {formatCurrency(
                            item.candidate_reportable_amount,
                            currencyValue
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                      {item.ai_suggested_category_name ? (
                        <span>Suggested by AI: {item.ai_suggested_category_name}</span>
                      ) : (
                        <span>No line item category suggestion</span>
                      )}
                      {item.tax_amount !== null && item.tax_amount !== undefined ? (
                        <span>Tax: {formatCurrency(item.tax_amount, currencyValue)}</span>
                      ) : null}
                      {item.ai_category_confidence !== null &&
                      item.ai_category_confidence !== undefined ? (
                        <span>
                          Confidence {Math.round(item.ai_category_confidence * 100)}%
                        </span>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="rounded-xl border border-border bg-card p-4">
            <h2 className="font-display text-lg">Expense allocation</h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Choose a property and allocation percentage before saving the reviewed
              expense.
            </p>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Field label="Property">
                <select
                  className={reviewSelectClassName}
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
              <Field label="Allocation method">
                <select
                  className={reviewSelectClassName}
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
                  className={reviewInputClassName}
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={normalizedPercentage}
                  disabled={allocationMethod !== "manual_percentage"}
                  onChange={(event) => setAllocationPercentage(event.target.value)}
                />
              </Field>
              <div className="rounded-xl border border-primary/20 bg-primary/10 p-4">
                <p className="text-sm text-primary">Candidate reportable amount</p>
                <p className="mt-2 font-display text-2xl text-primary">
                  {formatCurrency(candidateAmount, currencyValue)}
                </p>
              </div>
            </div>
          </div>

          <Field label="Notes">
            <textarea
              className={reviewTextareaClassName}
              name="notes"
              defaultValue={expense?.notes ?? ""}
            />
          </Field>

          {normalized.warnings?.length ? (
            <div className="rounded-xl border border-warm/30 bg-warm/10 p-3 text-sm">
              <div className="flex gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warm" />
                <div>
                  <p className="font-medium">Review warning</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {normalized.warnings.join(" ")}
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          <p className="text-xs text-muted-foreground">
            AI results must be reviewed before saving.
          </p>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button type="submit" disabled={isPending || isMissingLinkedExpense}>
            <Save className="h-4 w-4" />
            {isPending ? "Saving..." : "Save as reviewed expense"}
          </Button>
        </form>
      </div>
    </section>
  );
}
