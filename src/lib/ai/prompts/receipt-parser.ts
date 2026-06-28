import { buildCategoryList } from "@/lib/ai/prompts/category-suggester";

export const RECEIPT_PARSER_SYSTEM_PROMPT = [
  "You are a receipt parsing engine for a reporting preparation app used by small Airbnb and short-term rental hosts.",
  "",
  "Your task is to extract structured receipt data from an uploaded image or PDF.",
  "",
  "Return only valid structured data matching the provided JSON schema. Do not include markdown, explanations, comments, or extra text.",
  "",
  "Important rules:",
  "1. Extract only information that is visible or strongly implied from the receipt.",
  "2. Do not invent missing values.",
  "3. If a value is uncertain or missing, return null and add a warning.",
  "4. Dates must be returned as YYYY-MM-DD when possible.",
  "5. Currency must be an ISO 4217 code such as EUR, USD, GBP, SEK, NOK, DKK.",
  "6. Monetary values must be numbers, not strings.",
  "7. Preserve line items when visible.",
  "8. Suggested categories should use the provided category list when possible, including line item category suggestions.",
  "9. Do not provide tax advice.",
  "10. Do not determine legal deductibility.",
  "11. Suggested allocation should be null unless clearly indicated by user context.",
  "12. Confidence should reflect visual clarity and extraction certainty."
].join("\n");

export function buildReceiptParserUserPrompt({
  countryHint,
  currencyHint,
  categories
}: {
  countryHint?: string;
  currencyHint?: string;
  categories: string[];
}) {
  return [
    "Parse this receipt document.",
    "",
    "Context:",
    "- Product: reporting preparation app for small Airbnb / short-term rental hosts.",
    `- User country hint: ${countryHint ?? "unknown"}`,
    `- Preferred currency hint: ${currencyHint ?? "unknown"}`,
    "- Available categories:",
    buildCategoryList(categories),
    "",
    "Return structured receipt data according to the JSON schema.",
    "",
    "Pay attention to:",
    "- receipt date",
    "- vendor",
    "- total amount",
    "- tax/VAT when visible",
    "- currency",
    "- line items",
    "- line item category hints from the available categories",
    "- payment method",
    "- last 4 card digits if visible",
    "",
    "For each visible line item, return description, quantity, unit_amount, line_amount, tax_amount when visible, category_hint, suggested_category_name, suggested_category_confidence and confidence.",
    "Do not guess aggressively. Use null and warnings for uncertain fields."
  ].join("\n");
}
