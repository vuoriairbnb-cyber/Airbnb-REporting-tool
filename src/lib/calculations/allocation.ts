export type AllocationMethod = "full_rental_use" | "manual_percentage" | "excluded";

export function normalizeAllocationPercentage(
  method: AllocationMethod,
  percentage: number
) {
  if (method === "full_rental_use") return 100;
  if (method === "excluded") return 0;
  return Math.min(100, Math.max(0, percentage));
}

export function calculateCandidateReportableAmount(
  totalAmount: number,
  allocationPercentage: number
) {
  const allocatedAmount = totalAmount * (allocationPercentage / 100);

  return Math.round((allocatedAmount + Number.EPSILON) * 100) / 100;
}
