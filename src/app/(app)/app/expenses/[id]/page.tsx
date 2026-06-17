import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { ExpenseForm } from "@/components/expenses/ExpenseForm";
import {
  getCategories,
  getExpenseEntry,
  getProperties
} from "@/server/reporting/queries";

export default async function ExpenseDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [expense, properties, categories] = await Promise.all([
    getExpenseEntry(id),
    getProperties(),
    getCategories()
  ]);

  if (!expense) notFound();

  return (
    <>
      <PageHeader
        title="Expense details"
        description="Review allocation and expense data."
      />
      <ExpenseForm expense={expense} properties={properties} categories={categories} />
    </>
  );
}
