import { Plus, Tag } from "lucide-react";
import { Pill } from "@/components/app/primitives";
import { Button } from "@/components/ui/button";
import { DEFAULT_EXPENSE_CATEGORIES } from "@/lib/constants/categories";

export default function CategoriesPage() {
  return (
    <div className="space-y-5">
      <div className="min-w-0">
        <p className="text-sm text-muted-foreground">Settings</p>
        <h1 className="mt-1 font-display text-2xl leading-tight md:text-3xl">
          Categories
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Default and custom expense categories for expense allocation and tax-preparation
          reports.
        </p>
      </div>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-card">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
              <Tag className="h-5 w-5" />
            </span>
            <div>
              <p className="font-display text-lg">Expense categories</p>
              <p className="mt-1 text-sm text-muted-foreground">
                These categories help organize reporting preparation records.
              </p>
            </div>
          </div>
          <Pill tone="bg-primary/10 text-primary">Defaults</Pill>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {DEFAULT_EXPENSE_CATEGORIES.map((category) => (
            <span
              key={category}
              className="rounded-full border border-border bg-card px-3 py-1.5 text-xs"
            >
              {category}
            </span>
          ))}
        </div>

        <div className="mt-5 rounded-xl border border-dashed border-border bg-surface/60 p-4">
          <p className="font-medium">Custom categories</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Custom category management will appear here when the settings flow is
            connected.
          </p>
          <Button className="mt-4" variant="outline" disabled>
            <Plus className="h-4 w-4" />
            Add category
          </Button>
        </div>
      </section>
    </div>
  );
}
