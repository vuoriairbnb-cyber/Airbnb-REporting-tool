import { WalletCards } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/PageHeader";

export default function IncomePage() {
  return (
    <>
      <PageHeader
        title="Income"
        description="Track rental payouts and platform fees by property."
      />
      <Button>
        <WalletCards className="h-4 w-4" />
        Add income
      </Button>
    </>
  );
}
