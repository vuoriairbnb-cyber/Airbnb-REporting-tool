import { normalizeReceiptResult } from "@/lib/ai/normalize";
import { suggestCategoryFromList } from "@/lib/ai/prompts/category-suggester";
import type { ReceiptParser } from "@/lib/ai/types";

function chooseVendor(fileName?: string) {
  const lowerName = fileName?.toLowerCase() ?? "";

  if (lowerName.includes("clean")) return "Nordic Cleaning Co.";
  if (lowerName.includes("ikea")) return "IKEA";
  if (lowerName.includes("repair")) return "Fixit Maintenance";
  if (lowerName.includes("utility")) return "Helsinki Utilities";

  return "City Supplies";
}

function chooseTotal(fileName?: string) {
  const seed = [...(fileName ?? "receipt")].reduce(
    (sum, char) => sum + char.charCodeAt(0),
    0
  );

  return Math.round((24 + (seed % 180) + 0.9) * 100) / 100;
}

export const parseReceiptWithMock: ReceiptParser = async (input) => {
  const vendor = chooseVendor(input.fileName);
  const total = chooseTotal(input.fileName);
  const confidence =
    input.scanMode === "pro" ? 0.9 : input.scanMode === "plus" ? 0.86 : 0.74;
  const suggestedCategory =
    suggestCategoryFromList({
      suggestedCategory: vendor,
      categories: input.categoryHints
    }) ??
    input.categoryHints.find((category) => category === "Supplies") ??
    input.categoryHints[0] ??
    null;
  const supplyCategory =
    input.categoryHints.find((category) => category === "Supplies") ?? suggestedCategory;
  const serviceCategory =
    input.categoryHints.find((category) => category === "Professional services") ??
    suggestedCategory;

  return normalizeReceiptResult({
    provider: "mock",
    model: "mock-receipt-parser-v1",
    scanMode: input.scanMode,
    payload: {
      date: new Date().toISOString().slice(0, 10),
      vendor,
      total_amount: total,
      tax_amount: Math.round(total * 0.2 * 100) / 100,
      currency: input.currencyHint ?? "EUR",
      payment_method: "Card",
      last4: "4242",
      suggested_category: suggestedCategory,
      items: [
        {
          description: "Rental property supplies",
          quantity: 1,
          unit_amount: Math.round(total * 0.65 * 100) / 100,
          line_amount: Math.round(total * 0.65 * 100) / 100,
          tax_amount: null,
          category_hint: supplyCategory,
          suggested_category_name: supplyCategory,
          suggested_category_confidence: 0.82,
          confidence: confidence
        },
        {
          description: "Service fee",
          quantity: 1,
          unit_amount: Math.round(total * 0.35 * 100) / 100,
          line_amount: Math.round(total * 0.35 * 100) / 100,
          tax_amount: null,
          category_hint: serviceCategory,
          suggested_category_name: serviceCategory,
          suggested_category_confidence: 0.76,
          confidence: confidence
        }
      ],
      confidence,
      warnings: ["Mock extraction only. Review every field before reporting."]
    },
    rawResponse: {
      mock: true,
      fileName: input.fileName,
      mimeType: input.mimeType,
      byteLength: input.fileBuffer.byteLength
    }
  });
};
