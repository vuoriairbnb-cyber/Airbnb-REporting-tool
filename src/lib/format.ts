export function formatCurrency(amount: number | null | undefined, currency = "EUR") {
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency,
    maximumFractionDigits: 2
  }).format(Number(amount ?? 0));
}

export function formatDate(date: string | null | undefined) {
  if (!date) return "No date";

  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric"
  }).format(new Date(`${date}T00:00:00`));
}
