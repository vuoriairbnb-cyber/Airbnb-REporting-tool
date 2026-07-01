import { z } from "zod";
import { isAiScanMode, normalizeAiScanMode } from "@/lib/ai/scan-modes";
import type { AnyAiScanMode } from "@/lib/ai/types";
import { allocationMethodSchema } from "@/lib/validation/expenses";

const nullableUuid = z.preprocess((value) => {
  if (value === "" || value === null || value === undefined) return null;
  return value;
}, z.string().uuid().nullable());

const nullableString = z.preprocess((value) => {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}, z.string().nullable());

const nullableDate = z.preprocess((value) => {
  if (value === "" || value === null || value === undefined) return null;
  return value;
}, z.string().nullable());

export const createSourceDocumentSchema = z.object({
  fileName: z.string().trim().min(1).max(240),
  mimeType: z
    .string()
    .trim()
    .min(1)
    .refine(
      (mimeType) =>
        ["image/jpeg", "image/png", "image/webp", "application/pdf"].includes(mimeType),
      "File must be a JPG, PNG, WEBP or PDF."
    ),
  fileSizeBytes: z.coerce
    .number()
    .int()
    .positive()
    .max(10 * 1024 * 1024),
  propertyId: nullableUuid.optional()
});

export const parseReceiptSchema = z.object({
  sourceDocumentId: z.string().uuid(),
  scanMode: z
    .preprocess(
      (value) => {
        if (value === "" || value === null || value === undefined) return "standard";
        return value;
      },
      z.custom<AnyAiScanMode>((value) => isAiScanMode(value), "Invalid scan mode.")
    )
    .transform((value) => normalizeAiScanMode(value))
});

export const reviewReceiptSchema = z.object({
  property_id: nullableUuid,
  date: nullableDate,
  vendor: nullableString,
  category_id: nullableUuid,
  total_amount: z.coerce.number().nonnegative(),
  currency: z.string().trim().min(3).max(3),
  allocation_method: allocationMethodSchema,
  allocation_percentage: z.coerce.number().min(0).max(100),
  notes: nullableString,
  line_items: z
    .array(
      z.object({
        id: z.string().trim().min(1),
        description: nullableString,
        quantity: z.coerce.number().nonnegative().nullable().optional(),
        unit_amount: z.coerce.number().nonnegative().nullable().optional(),
        line_amount: z.coerce.number().nonnegative().nullable(),
        tax_amount: z.coerce.number().nonnegative().nullable().optional(),
        amount: z.coerce.number().nonnegative().nullable().optional(),
        category_hint: nullableString.optional(),
        suggested_category_name: nullableString.optional(),
        suggested_category_confidence: z.coerce
          .number()
          .min(0)
          .max(1)
          .nullable()
          .optional(),
        confidence: z.coerce.number().min(0).max(1).nullable().optional(),
        ai_suggested_category_name: nullableString.optional(),
        ai_suggested_category_id: nullableUuid.optional(),
        ai_category_confidence: z.coerce.number().min(0).max(1).nullable().optional(),
        user_selected_category_id: nullableUuid.optional(),
        is_hidden: z.coerce.boolean().optional(),
        allocation_percentage: z.coerce.number().min(0).max(100)
      })
    )
    .optional()
    .default([])
});
