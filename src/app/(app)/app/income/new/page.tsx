import { PageHeader } from "@/components/layout/PageHeader";
import { IncomeForm } from "@/components/income/IncomeForm";
import { getProperties } from "@/server/reporting/queries";

export default async function NewIncomePage() {
  const properties = await getProperties();

  return (
    <>
      <PageHeader title="New income" description="Add a manual rental income entry." />
      <IncomeForm properties={properties} />
    </>
  );
}
