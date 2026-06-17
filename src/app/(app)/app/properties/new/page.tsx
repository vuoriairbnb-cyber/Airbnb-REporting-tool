import { PageHeader } from "@/components/layout/PageHeader";
import { PropertyForm } from "@/components/properties/PropertyForm";

export default function NewPropertyPage() {
  return (
    <>
      <PageHeader title="New property" description="Create a property for reporting." />
      <PropertyForm />
    </>
  );
}
