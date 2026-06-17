import { Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/PageHeader";

export default function ExpensesPage() {
  return (
    <>
      <PageHeader
        title="Expenses"
        description="Track expenses, allocation percentages and candidate reportable amounts."
      />
      <Button>
        <Receipt className="h-4 w-4" />
        Add expense
      </Button>
    </>
  );
}
