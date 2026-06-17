export function PageHeader({
  title,
  description
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-semibold">{title}</h1>
      {description ? (
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{description}</p>
      ) : null}
    </div>
  );
}
