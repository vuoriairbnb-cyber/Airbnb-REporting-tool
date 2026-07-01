"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FileArchive,
  FileSpreadsheet,
  FileText,
  Loader2,
  Sparkles,
  type LucideIcon
} from "lucide-react";
import { Pill } from "@/components/app/primitives";
import { useFeedback } from "@/components/feedback/FeedbackProvider";
import { FailureState } from "@/components/state/FailureState";
import { SuccessState } from "@/components/state/SuccessState";
import { Button } from "@/components/ui/button";
import { Field, inputClassName, selectClassName } from "@/components/forms/Field";
import { parseApiError } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import type { CategoryRow, PropertyRow, ReportType } from "@/server/reporting/types";

type ReportTypeOption = {
  type: ReportType;
  icon: LucideIcon;
  name: string;
  description: string;
};

const reportTypes: ReportTypeOption[] = [
  {
    type: "income_csv",
    icon: FileSpreadsheet,
    name: "Income CSV",
    description: "Income entries with platform, fees and net payout."
  },
  {
    type: "expense_csv",
    icon: FileSpreadsheet,
    name: "Expense CSV",
    description: "Expenses with category, total amount and expense allocation."
  },
  {
    type: "allocation_csv",
    icon: FileSpreadsheet,
    name: "Allocation CSV",
    description: "Per-expense candidate reportable amounts and allocation percentage."
  },
  {
    type: "tax_preparation_pdf",
    icon: FileText,
    name: "Tax-preparation PDF",
    description: "Summary for reporting preparation and professional review."
  },
  {
    type: "receipt_archive_zip",
    icon: FileArchive,
    name: "Receipt archive ZIP",
    description: "Receipt archive package for reviewed source documents."
  },
  {
    type: "full_reporting_zip",
    icon: FileArchive,
    name: "Full reporting ZIP",
    description: "CSV exports, PDF summary and receipt archive in one package."
  }
];

function currentYear() {
  return new Date().getFullYear();
}

function lastDayOfMonth(year: number, month: string) {
  return new Date(year, Number(month), 0).getDate();
}

function initialDateRange() {
  const year = currentYear();

  return {
    dateFrom: `${year}-01-01`,
    dateTo: `${year}-12-31`
  };
}

export function ReportCreateForm({
  properties,
  categories
}: {
  properties: PropertyRow[];
  categories: CategoryRow[];
}) {
  const router = useRouter();
  const feedback = useFeedback();
  const initialRange = initialDateRange();
  const [selectedType, setSelectedType] = useState<ReportType>("full_reporting_zip");
  const [year, setYear] = useState(String(currentYear()));
  const [month, setMonth] = useState("all");
  const [dateFrom, setDateFrom] = useState(initialRange.dateFrom);
  const [dateTo, setDateTo] = useState(initialRange.dateTo);
  const [propertyId, setPropertyId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const years = useMemo(() => {
    const baseYear = currentYear();
    return Array.from({ length: 5 }, (_, index) => String(baseYear - index));
  }, []);

  function updateYear(nextYear: string) {
    setYear(nextYear);

    if (month === "all") {
      setDateFrom(`${nextYear}-01-01`);
      setDateTo(`${nextYear}-12-31`);
      return;
    }

    const lastDay = lastDayOfMonth(Number(nextYear), month);
    setDateFrom(`${nextYear}-${month}-01`);
    setDateTo(`${nextYear}-${month}-${String(lastDay).padStart(2, "0")}`);
  }

  function updateMonth(nextMonth: string) {
    setMonth(nextMonth);

    if (nextMonth === "all") {
      setDateFrom(`${year}-01-01`);
      setDateTo(`${year}-12-31`);
      return;
    }

    const lastDay = lastDayOfMonth(Number(year), nextMonth);
    setDateFrom(`${year}-${nextMonth}-01`);
    setDateTo(`${year}-${nextMonth}-${String(lastDay).padStart(2, "0")}`);
  }

  async function handleGenerate() {
    setError(null);
    setMessage(null);

    if (!disclaimerAccepted) {
      setError("Accept the disclaimer reminder before generating a report.");
      feedback.error({ title: "Report generation blocked." });
      return;
    }

    setIsPending(true);
    const response = await fetch("/api/reports/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: selectedType,
        property_id: propertyId || null,
        category_id: categoryId || null,
        date_from: dateFrom,
        date_to: dateTo
      })
    });
    setIsPending(false);

    if (!response.ok) {
      setError(await parseApiError(response, "Could not generate report."));
      return;
    }

    setMessage("Report created. Download it when the status changes to ready.");
    feedback.success({ title: "Report generated." });
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border bg-card p-5 shadow-card">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-display text-lg">Report filters</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Choose the reporting preparation period and scope.
            </p>
          </div>
          <Pill tone="bg-primary/10 text-primary">Tax-preparation reports</Pill>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Field label="Year">
            <select
              className={selectClassName}
              value={year}
              onChange={(event) => updateYear(event.target.value)}
            >
              {years.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Month">
            <select
              className={selectClassName}
              value={month}
              onChange={(event) => updateMonth(event.target.value)}
            >
              <option value="all">Full year</option>
              <option value="01">January</option>
              <option value="02">February</option>
              <option value="03">March</option>
              <option value="04">April</option>
              <option value="05">May</option>
              <option value="06">June</option>
              <option value="07">July</option>
              <option value="08">August</option>
              <option value="09">September</option>
              <option value="10">October</option>
              <option value="11">November</option>
              <option value="12">December</option>
            </select>
          </Field>

          <Field label="Date from">
            <input
              className={inputClassName}
              type="date"
              value={dateFrom}
              onChange={(event) => setDateFrom(event.target.value)}
            />
          </Field>

          <Field label="Date to">
            <input
              className={inputClassName}
              type="date"
              value={dateTo}
              onChange={(event) => setDateTo(event.target.value)}
            />
          </Field>

          <Field label="Property">
            <select
              className={selectClassName}
              value={propertyId}
              onChange={(event) => setPropertyId(event.target.value)}
            >
              <option value="">All properties</option>
              {properties.map((property) => (
                <option key={property.id} value={property.id}>
                  {property.name}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Field label="Category">
            <select
              className={selectClassName}
              value={categoryId}
              onChange={(event) => setCategoryId(event.target.value)}
            >
              <option value="">All categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </section>

      <section>
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="font-display text-lg">Generate a report</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Select one report type for the current filters.
            </p>
          </div>
          <Button onClick={handleGenerate} disabled={isPending}>
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {isPending ? "Generating..." : "Generate report"}
          </Button>
        </div>

        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {reportTypes.map((report) => (
            <button
              key={report.type}
              type="button"
              onClick={() => setSelectedType(report.type)}
              className={cn(
                "flex min-h-48 flex-col rounded-2xl border border-border bg-card p-5 text-left shadow-card transition hover:border-primary/40 hover:bg-muted/30",
                selectedType === report.type && "border-primary bg-primary/5"
              )}
            >
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                <report.icon className="h-5 w-5" />
              </span>
              <p className="mt-4 font-medium">{report.name}</p>
              <p className="mt-1 flex-1 text-sm leading-6 text-muted-foreground">
                {report.description}
              </p>
              {selectedType === report.type ? (
                <Pill tone="mt-4 w-fit bg-primary/10 text-primary">Selected</Pill>
              ) : null}
            </button>
          ))}
        </div>

        <label className="mt-4 flex items-start gap-3 rounded-2xl border border-border bg-card p-4 text-sm shadow-card">
          <input
            className="mt-1 h-4 w-4 rounded border-border"
            type="checkbox"
            checked={disclaimerAccepted}
            onChange={(event) => setDisclaimerAccepted(event.target.checked)}
          />
          <span className="leading-6 text-muted-foreground">
            I understand this app creates tax-preparation reports for reporting
            preparation only. Users are responsible for verifying candidate reportable
            amounts before reporting.
          </span>
        </label>

        {error ? (
          <div className="mt-3">
            <FailureState
              variant="inline"
              title="Could not generate report"
              description={error}
            />
            {error === "Disclaimer acceptance is required before generating reports." ? (
              <Button asChild variant="outline" size="sm" className="mt-3">
                <Link href="/app/settings">Open settings</Link>
              </Button>
            ) : null}
          </div>
        ) : null}
        {message ? (
          <div className="mt-3">
            <SuccessState title="Report generated" description={message} />
          </div>
        ) : null}
      </section>
    </div>
  );
}
