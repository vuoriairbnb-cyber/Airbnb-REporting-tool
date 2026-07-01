import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { PropertyForm } from "@/components/properties/PropertyForm";
import { getProperty, getPropertyImageUrls } from "@/server/reporting/queries";

export default async function PropertyDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const property = await getProperty(id);

  if (!property) notFound();

  const imageUrls = await getPropertyImageUrls([property]);

  return (
    <>
      <PageHeader
        title="Property details"
        description="Edit property settings and defaults."
      />
      <PropertyForm property={property} initialImageUrl={imageUrls[property.id]} />
    </>
  );
}
