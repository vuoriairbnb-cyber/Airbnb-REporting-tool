import {
  parsedReceiptResultSchema,
  receiptNormalizationItemSchema,
  receiptNormalizationSchema,
  type AiReceiptPayload
} from "@/lib/ai/schemas/receipt.schema";
import type { ParseReceiptResult, ParsedReceiptItem, ScanMode } from "@/lib/ai/types";

export type { AiReceiptPayload };

function normalizeItem(
  item: typeof receiptNormalizationItemSchema._output,
  index: number
) {
  const lineAmount = item.line_amount ?? item.amount;

  return {
    id: `item-${index + 1}`,
    description: item.description ?? "Receipt item",
    quantity: item.quantity,
    unit_amount: item.unit_amount,
    line_amount: lineAmount,
    tax_amount: item.tax_amount,
    amount: lineAmount,
    category_hint: item.category_hint,
    suggested_category_name: item.suggested_category_name ?? item.category_hint,
    suggested_category_confidence: item.suggested_category_confidence,
    confidence: item.confidence
  } satisfies ParsedReceiptItem;
}

function inferConfidence(
  payload: typeof receiptNormalizationSchema._output,
  scanMode: ScanMode
) {
  if (payload.confidence !== null) return payload.confidence;

  const fields = [
    payload.date,
    payload.vendor,
    payload.total_amount,
    payload.currency,
    payload.suggested_category
  ];
  const populated = fields.filter(
    (field) => field !== null && field !== undefined && field !== ""
  ).length;
  const base = populated / fields.length;
  const scanModeBoost = scanMode === "pro" ? 0.16 : scanMode === "plus" ? 0.12 : 0;

  return Math.max(0.35, Math.min(0.95, Number((base + scanModeBoost).toFixed(2))));
}

export function normalizeReceiptResult({
  provider,
  model,
  scanMode,
  payload,
  rawResponse
}: {
  provider: ParseReceiptResult["provider"];
  model: string;
  scanMode: ScanMode;
  payload: AiReceiptPayload;
  rawResponse: unknown;
}): ParseReceiptResult {
  const parsed = receiptNormalizationSchema.parse(payload);
  const warnings = parsed.warnings
    .map((warning) => warning.trim())
    .filter((warning) => warning.length > 0);

  if (!parsed.total_amount) {
    warnings.push("Total amount was not detected. Review the receipt manually.");
  }

  if (!parsed.vendor) {
    warnings.push("Vendor was not detected. Review the receipt manually.");
  }

  const parsedItems = parsed.line_items.length ? parsed.line_items : parsed.items;
  const items =
    parsedItems.length || !parsed.total_amount
      ? parsedItems
      : [
          {
            description: parsed.vendor
              ? `${parsed.vendor} receipt total`
              : "Receipt total",
            quantity: 1,
            unit_amount: parsed.total_amount,
            line_amount: parsed.total_amount,
            tax_amount: parsed.tax_amount,
            amount: parsed.total_amount,
            category_hint: parsed.suggested_category,
            suggested_category_name: parsed.suggested_category,
            suggested_category_confidence: parsed.confidence,
            confidence: parsed.confidence
          }
        ];

  const result = {
    provider,
    model,
    scanMode,
    receipt: {
      date: parsed.date,
      vendor: parsed.vendor,
      total_amount: parsed.total_amount,
      tax_amount: parsed.tax_amount,
      currency: parsed.currency,
      payment_method: parsed.payment_method,
      last4: parsed.last4,
      suggested_category: parsed.suggested_category,
      items: items.map(normalizeItem),
      confidence: inferConfidence(parsed, scanMode),
      warnings
    },
    rawResponse
  };

  return parsedReceiptResultSchema.parse(result) as ParseReceiptResult;
}
