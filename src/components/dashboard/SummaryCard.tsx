import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function SummaryCard({
  label,
  value,
  note
}: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold">{value}</p>
        <p className="mt-2 text-xs text-muted-foreground">{note}</p>
      </CardContent>
    </Card>
  );
}
