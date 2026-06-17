import { z } from "zod";

export const allocationMethodSchema = z.enum([
  "full_rental_use",
  "manual_percentage",
  "excluded"
]);

const nullableUuid = z.preprocess((value) => {
  if (value === "" || value === null || value === undefined) return null;
  return value;
}, z.string().uuid().nullable());

const nullableDate = z.preprocess((value) => {
  if (value === "" || value === null || value === undefined) return null;
  return value;
}, z.string().nullable());

const nullableString = z.preprocess((value) => {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}, z.string().nullable());

export const expenseInputSchema = z.object({
  property_id: nullableUuid,
  date: nullableDate,
  vendor: nullableString,
  category_id: nullableUuid,
  total_amount: z.coerce.number().nonnegative(),
  currency: z.string().trim().min(3).max(3),
  allocation_method: allocationMethodSchema,
  allocation_percentage: z.coerce.number().min(0).max(100),
  notes: nullableString
});
