import Link from "next/link";
import { FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/state/EmptyState";

export default function NotFound() {
  return (
    <main className="p-4">
      <EmptyState
        icon={FileQuestion}
        title="Page not found"
        description="This page does not exist or has moved."
      />
      <div className="mt-4 flex justify-center">
        <Button asChild>
          <Link href="/">Go home</Link>
        </Button>
      </div>
    </main>
  );
}
