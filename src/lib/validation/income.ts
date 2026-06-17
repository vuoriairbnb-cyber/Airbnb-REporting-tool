import { z } from "zod";

const nullableAmount = z.preprocess((value) => {
  if (value === "" || value === null || value === undefined) return null;
  return Number(value);
}, z.number().nonnegative().nullable());

const nullableString = z.preprocess((value) => {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}, z.string().nullable());

const nullableUuid = z.preprocess((value) => {
  if (value === "" || value === null || value === undefined) return null;
  return value;
}, z.string().uuid().nullable());

export const incomeInputSchema = z.object({
  property_id: nullableUuid,
  date: z.string().min(1),
  platform: z.string().trim().min(1),
  gross_amount: nullableAmount,
  platform_fee: nullableAmount,
  cleaning_fee: nullableAmount,
  net_payout: nullableAmount,
  currency: z.string().trim().min(3).max(3),
  notes: nullableString
});
