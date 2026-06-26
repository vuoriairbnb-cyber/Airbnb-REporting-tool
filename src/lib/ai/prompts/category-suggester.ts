export function buildCategoryList(categories: string[]) {
  if (categories.length === 0) return "- Other";

  return categories.map((category) => `- ${category}`).join("\n");
}

export function suggestCategoryFromList({
  suggestedCategory,
  categories
}: {
  suggestedCategory: string | null;
  categories: string[];
}) {
  if (!suggestedCategory) return null;

  const exact = categories.find(
    (category) => category.toLowerCase() === suggestedCategory.toLowerCase()
  );

  if (exact) return exact;

  return (
    categories.find((category) =>
      suggestedCategory.toLowerCase().includes(category.toLowerCase())
    ) ?? null
  );
}
