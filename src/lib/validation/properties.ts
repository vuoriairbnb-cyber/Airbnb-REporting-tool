import { z } from "zod";

const nullableString = z.preprocess((value) => {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}, z.string().nullable());

const nullablePercentage = z.preprocess((value) => {
  if (value === "" || value === null || value === undefined) return null;
  return Number(value);
}, z.number().min(0).max(100).nullable());

export const propertyInputSchema = z.object({
  name: z.string().trim().min(1),
  address: nullableString,
  city: nullableString,
  country: z.string().trim().min(2),
  currency: z.string().trim().min(3).max(3),
  image_path: nullableString,
  default_allocation_method: nullableString,
  default_allocation_percentage: nullablePercentage,
  is_active: z.coerce.boolean().default(true)
});
