import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { IncomeForm } from "@/components/income/IncomeForm";
import { getIncomeEntry, getProperties } from "@/server/reporting/queries";

export default async function IncomeDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [income, properties] = await Promise.all([getIncomeEntry(id), getProperties()]);

  if (!income) notFound();

  return (
    <>
      <PageHeader
        title="Income details"
        description="Review or edit this income entry."
      />
      <IncomeForm income={income} properties={properties} />
    </>
  );
}
