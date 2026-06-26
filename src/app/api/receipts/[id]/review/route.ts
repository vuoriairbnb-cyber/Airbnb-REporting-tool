import { NextResponse } from "next/server";
import {
  calculateCandidateReportableAmount,
  normalizeAllocationPercentage
} from "@/lib/calculations/allocation";
import { createClient } from "@/lib/supabase/server";
import { reviewReceiptSchema } from "@/lib/validation/receipts";
import { apiError, logServerError, parseJsonBody } from "@/server/reporting/api";
import type { SupabaseReportingClient } from "@/server/reporting/db";
import { assertExpenseRelations, isOwnershipError } from "@/server/reporting/ownership";
import { getCurrentUserId } from "@/server/reporting/queries";
import type { ReceiptRow } from "@/server/reporting/types";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getCurrentUserId();

  if (!userId) return apiError("Authentication required.", 401);

  const parsed = await parseJsonBody(request, reviewReceiptSchema);

  if (parsed.error || !parsed.data) return apiError(parsed.error ?? "Invalid review.");

  const { id } = await params;

  try {
    await assertExpenseRelations(userId, parsed.data);
  } catch (error) {
    if (isOwnershipError(error)) return apiError(error.message, error.status);
    logServerError("receipts.review.ownership", error);
    return apiError("Could not verify receipt review ownership.", 500);
  }

  const supabase = (await createClient()) as unknown as SupabaseReportingClient;
  const { data: receiptData, error: receiptError } = await supabase
    .from("receipts")
    .select("id,expense_entry_id")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (receiptError || !receiptData) return apiError("Receipt not found.", 404);

  const receipt = receiptData as Pick<ReceiptRow, "id" | "expense_entry_id">;

  if (!receipt.expense_entry_id) {
    return apiError(
      "This receipt does not have a linked expense draft. Add the expense manually or try parsing the receipt again.",
      409
    );
  }

  const allocationPercentage = normalizeAllocationPercentage(
    parsed.data.allocation_method,
    parsed.data.allocation_percentage
  );
  const candidateReportableAmount = calculateCandidateReportableAmount(
    parsed.data.total_amount,
    allocationPercentage
  );
  const status = parsed.data.allocation_method === "excluded" ? "excluded" : "reviewed";

  const { data: expense, error: expenseError } = await supabase
    .from("expense_entries")
    .update({
      ...parsed.data,
      allocation_percentage: allocationPercentage,
      candidate_reportable_amount: candidateReportableAmount,
      status
    })
    .eq("id", receipt.expense_entry_id)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (expenseError || !expense) {
    logServerError("receipts.review.expense", expenseError);
    return apiError("Could not save expense.", 500);
  }

  const { error: reviewError } = await supabase
    .from("receipts")
    .update({
      status: "reviewed",
      reviewed_at: new Date().toISOString(),
      reviewed_by: userId
    })
    .eq("id", id)
    .eq("user_id", userId);

  if (reviewError) {
    logServerError("receipts.review", reviewError);
    return apiError("Could not mark receipt reviewed.", 500);
  }

  return NextResponse.json({ data: { receiptId: id, expense } });
}
