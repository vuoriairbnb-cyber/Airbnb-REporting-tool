import { PageHeader } from "@/components/layout/PageHeader";
import { ExpenseForm } from "@/components/expenses/ExpenseForm";
import { getCategories, getProperties } from "@/server/reporting/queries";

export default async function NewExpensePage() {
  const [properties, categories] = await Promise.all([getProperties(), getCategories()]);

  return (
    <>
      <PageHeader title="New expense" description="Add a manual expense entry." />
      <ExpenseForm properties={properties} categories={categories} />
    </>
  );
}
