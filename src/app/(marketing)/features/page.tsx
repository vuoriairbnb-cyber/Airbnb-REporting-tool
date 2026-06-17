import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  "Property-level income tracking",
  "Manual expense entry",
  "AI-assisted receipt extraction",
  "Rental-use allocation percentages",
  "Candidate reportable amount calculations",
  "CSV, PDF and ZIP report preparation"
];

export default function FeaturesPage() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-14">
      <h1 className="text-3xl font-semibold">Features</h1>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {features.map((feature) => (
          <Card key={feature}>
            <CardHeader>
              <CardTitle>{feature}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Built for hosts who need organized preparation data without turning the
              product into bookkeeping software.
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
