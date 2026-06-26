import { z } from "zod";

export const receiptWarningSchema = z.string().trim().min(1);

export const receiptConfidenceSchema = z.number().min(0).max(1).nullable();

export const receiptCurrencySchema = z
  .string()
  .trim()
  .length(3)
  .transform((value) => value.toUpperCase())
  .nullable();

export const receiptAmountSchema = z.number().nonnegative().nullable();

export const parsedReceiptItemSchema = z.object({
  description: z.string().trim().nullable(),
  quantity: z.number().nonnegative().nullable(),
  amount: receiptAmountSchema
});

export const normalizedParsedReceiptItemSchema = parsedReceiptItemSchema.extend({
  id: z.string().trim().min(1)
});

export const parsedReceiptSchema = z.object({
  date: z.string().trim().nullable(),
  vendor: z.string().trim().nullable(),
  total_amount: receiptAmountSchema,
  tax_amount: receiptAmountSchema,
  currency: receiptCurrencySchema,
  payment_method: z.string().trim().nullable(),
  last4: z.string().trim().nullable(),
  suggested_category: z.string().trim().nullable(),
  items: z.array(parsedReceiptItemSchema),
  confidence: receiptConfidenceSchema,
  warnings: z.array(receiptWarningSchema)
});

export const parsedReceiptResultSchema = z.object({
  provider: z.enum(["mock", "openai", "anthropic"]),
  model: z.string().trim().min(1),
  scanMode: z.enum(["fast", "accurate"]),
  receipt: parsedReceiptSchema.extend({
    items: z.array(normalizedParsedReceiptItemSchema),
    confidence: z.number().min(0).max(1)
  }),
  rawResponse: z.unknown()
});

const nullableString = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((value) => {
    if (typeof value !== "string") return null;
    const trimmed = value.trim();

    return trimmed.length > 0 ? trimmed : null;
  });

const nullableNumber = z
  .union([z.number(), z.string(), z.null(), z.undefined()])
  .transform((value) => {
    if (value === null || value === undefined || value === "") return null;
    const parsed = Number(value);

    return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
  });

export const receiptNormalizationItemSchema = z.object({
  description: nullableString,
  quantity: nullableNumber,
  amount: nullableNumber
});

export const receiptNormalizationSchema = z.object({
  date: nullableString,
  vendor: nullableString,
  total_amount: nullableNumber,
  tax_amount: nullableNumber,
  currency: nullableString.transform((value) => value?.toUpperCase() ?? null),
  payment_method: nullableString,
  last4: nullableString,
  suggested_category: nullableString,
  items: z.array(receiptNormalizationItemSchema).optional().default([]),
  confidence: z
    .union([z.number(), z.string(), z.null(), z.undefined()])
    .transform((value) => {
      const parsed = Number(value);

      if (!Number.isFinite(parsed)) return null;

      return Math.max(0, Math.min(1, parsed));
    }),
  warnings: z.array(z.string()).optional().default([])
});

export type ParsedReceipt = z.output<typeof parsedReceiptSchema>;
export type ParsedReceiptItem = z.output<typeof parsedReceiptItemSchema>;
export type NormalizedParsedReceiptItem = z.output<
  typeof normalizedParsedReceiptItemSchema
>;
export type AiReceiptPayload = z.input<typeof receiptNormalizationSchema>;

export const receiptParserJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    date: { type: ["string", "null"], description: "Receipt date as YYYY-MM-DD." },
    vendor: { type: ["string", "null"] },
    total_amount: { type: ["number", "null"] },
    tax_amount: { type: ["number", "null"] },
    currency: { type: ["string", "null"], description: "ISO 4217 currency code." },
    payment_method: { type: ["string", "null"] },
    last4: { type: ["string", "null"] },
    suggested_category: { type: ["string", "null"] },
    items: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          description: { type: ["string", "null"] },
          quantity: { type: ["number", "null"] },
          amount: { type: ["number", "null"] }
        },
        required: ["description", "quantity", "amount"]
      }
    },
    confidence: {
      type: ["number", "null"],
      description: "A 0 to 1 confidence score for extracted receipt fields."
    },
    warnings: {
      type: "array",
      items: { type: "string" }
    }
  },
  required: [
    "date",
    "vendor",
    "total_amount",
    "tax_amount",
    "currency",
    "payment_method",
    "last4",
    "suggested_category",
    "items",
    "confidence",
    "warnings"
  ]
} as const;
