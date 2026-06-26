import { Button } from "@/components/ui/button";
import { Field, inputClassName, selectClassName } from "@/components/forms/Field";
import type {
  CategoryRow,
  PropertyRow,
  ReportingFilters
} from "@/server/reporting/types";

export function ReportingFilters({
  filters,
  properties,
  categories,
  includeCategory = false,
  includeStatus = false
}: {
  filters: ReportingFilters;
  properties: PropertyRow[];
  categories?: CategoryRow[];
  includeCategory?: boolean;
  includeStatus?: boolean;
}) {
  return (
    <form className="grid gap-3 rounded-2xl border border-border bg-card p-4 shadow-card md:grid-cols-5">
      <Field label="From">
        <input
          className={inputClassName}
          type="date"
          name="dateFrom"
          defaultValue={filters.dateFrom}
        />
      </Field>
      <Field label="To">
        <input
          className={inputClassName}
          type="date"
          name="dateTo"
          defaultValue={filters.dateTo}
        />
      </Field>
      <Field label="Property">
        <select
          className={selectClassName}
          name="propertyId"
          defaultValue={filters.propertyId ?? ""}
        >
          <option value="">All properties</option>
          {properties.map((property) => (
            <option key={property.id} value={property.id}>
              {property.name}
            </option>
          ))}
        </select>
      </Field>
      {includeCategory ? (
        <Field label="Category">
          <select
            className={selectClassName}
            name="categoryId"
            defaultValue={filters.categoryId ?? ""}
          >
            <option value="">All categories</option>
            {categories?.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </Field>
      ) : null}
      {includeStatus ? (
        <Field label="Status">
          <select
            className={selectClassName}
            name="status"
            defaultValue={filters.status ?? ""}
          >
            <option value="">All statuses</option>
            <option value="reviewed">Reviewed</option>
            <option value="excluded">Excluded</option>
            <option value="archived">Archived</option>
            <option value="draft">Draft</option>
            <option value="needs_review">Needs review</option>
          </select>
        </Field>
      ) : null}
      <div className="flex items-end gap-2">
        <Button className="w-full" type="submit">
          Filter
        </Button>
      </div>
    </form>
  );
}
