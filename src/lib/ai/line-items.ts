import {
  calculateCandidateReportableAmount,
  normalizeAllocationPercentage
} from "@/lib/calculations/allocation";
import type { ParsedReceiptItem } from "@/lib/ai/types";
import type { CategoryRow } from "@/server/reporting/types";

export type ReviewLineItem = ParsedReceiptItem & {
  ai_suggested_category_name: string | null;
  ai_suggested_category_id: string | null;
  ai_category_confidence: number | null;
  user_selected_category_id: string | null;
  allocation_percentage: number;
  candidate_reportable_amount: number | null;
};

function categoryKey(value: string | null | undefined) {
  return value?.trim().toLowerCase().replace(/\s+/g, " ") ?? "";
}

export function matchAllowedCategory(
  categoryName: string | null | undefined,
  categories: CategoryRow[]
) {
  const key = categoryKey(categoryName);
  if (!key) return null;

  return categories.find((category) => categoryKey(category.name) === key) ?? null;
}

export function addReviewMetadataToLineItems({
  items,
  categories,
  fallbackCategoryName,
  defaultAllocationPercentage = 100
}: {
  items: ParsedReceiptItem[];
  categories: CategoryRow[];
  fallbackCategoryName?: string | null;
  defaultAllocationPercentage?: number;
}): ReviewLineItem[] {
  const allocationPercentage = normalizeAllocationPercentage(
    "manual_percentage",
    defaultAllocationPercentage
  );

  return items.map((item) => {
    const aiSuggestedCategoryName =
      item.suggested_category_name ?? item.category_hint ?? fallbackCategoryName ?? null;
    const matchedCategory = matchAllowedCategory(aiSuggestedCategoryName, categories);
    const lineAmount = item.line_amount ?? item.amount;

    return {
      ...item,
      line_amount: lineAmount,
      amount: lineAmount,
      ai_suggested_category_name: aiSuggestedCategoryName,
      ai_suggested_category_id: matchedCategory?.id ?? null,
      ai_category_confidence: item.suggested_category_confidence ?? item.confidence,
      user_selected_category_id: matchedCategory?.id ?? null,
      allocation_percentage: allocationPercentage,
      candidate_reportable_amount:
        lineAmount === null || lineAmount === undefined
          ? null
          : calculateCandidateReportableAmount(lineAmount, allocationPercentage)
    };
  });
}
