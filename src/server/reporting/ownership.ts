import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { SupabaseReportingClient } from "@/server/reporting/db";

export class OwnershipError extends Error {
  status: number;

  constructor(message: string, status = 404) {
    super(message);
    this.name = "OwnershipError";
    this.status = status;
  }
}

export function isOwnershipError(error: unknown): error is OwnershipError {
  return error instanceof OwnershipError;
}

async function getDb() {
  return (await createClient()) as unknown as SupabaseReportingClient;
}

async function assertUserOwnsRow(
  table: string,
  userId: string,
  id: unknown,
  message: string
) {
  if (id === null || id === undefined || id === "") return;

  if (typeof id !== "string") {
    throw new OwnershipError(message);
  }

  const db = await getDb();
  const { data, error } = await db
    .from(table)
    .select("id")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    throw new OwnershipError(message);
  }
}

export async function assertUserOwnsProperty(userId: string, propertyId: unknown) {
  await assertUserOwnsRow("properties", userId, propertyId, "Property not found.");
}

export async function assertUserOwnsExpense(userId: string, expenseId: unknown) {
  await assertUserOwnsRow("expense_entries", userId, expenseId, "Expense not found.");
}

export async function assertUserOwnsReceipt(userId: string, receiptId: unknown) {
  await assertUserOwnsRow("receipts", userId, receiptId, "Receipt not found.");
}

export async function assertUserOwnsSourceDocument(
  userId: string,
  sourceDocumentId: unknown
) {
  await assertUserOwnsRow(
    "source_documents",
    userId,
    sourceDocumentId,
    "Source document not found."
  );
}

export async function assertUserOwnsReport(userId: string, reportId: unknown) {
  await assertUserOwnsRow("reports", userId, reportId, "Report not found.");
}

export async function assertAllowedCategory(userId: string, categoryId: unknown) {
  if (categoryId === null || categoryId === undefined || categoryId === "") return;

  if (typeof categoryId !== "string") {
    throw new OwnershipError("Category not found.");
  }

  const db = await getDb();
  const { data, error } = await db
    .from("categories")
    .select("id,user_id,is_default")
    .eq("id", categoryId)
    .single();

  const category = data as {
    user_id?: string | null;
    is_default?: boolean | null;
  } | null;

  const isAllowedDefault = category?.is_default === true && category.user_id === null;
  const isAllowedUserCategory = category?.user_id === userId;

  if (error || !category || (!isAllowedDefault && !isAllowedUserCategory)) {
    throw new OwnershipError("Category not found.");
  }
}

export async function assertIncomeRelations(
  userId: string,
  input: {
    property_id?: unknown;
  }
) {
  await assertUserOwnsProperty(userId, input.property_id);
}

export async function assertExpenseRelations(
  userId: string,
  input: {
    property_id?: unknown;
    category_id?: unknown;
  }
) {
  await Promise.all([
    assertUserOwnsProperty(userId, input.property_id),
    assertAllowedCategory(userId, input.category_id)
  ]);
}

export async function assertReportFilters(
  userId: string,
  filters: {
    property_id?: unknown;
    category_id?: unknown;
  }
) {
  await Promise.all([
    assertUserOwnsProperty(userId, filters.property_id),
    assertAllowedCategory(userId, filters.category_id)
  ]);
}
