import type { ReceiptParser } from "@/lib/ai/types";

export const parseReceiptWithMock: ReceiptParser = async (input) => ({
  provider: "mock",
  model: "mock-receipt-parser-v1",
  scanMode: input.scanMode,
  receipt: {
    date: null,
    vendor: input.fileName?.split(".")[0] ?? "Receipt vendor",
    total_amount: null,
    tax_amount: null,
    currency: input.currencyHint ?? null,
    payment_method: null,
    last4: null,
    suggested_category: input.categoryHints[0] ?? null,
    items: [],
    confidence: 0,
    warnings: ["Mock parser returned placeholder data. User review is required."]
  },
  rawResponse: {
    mock: true
  }
});
