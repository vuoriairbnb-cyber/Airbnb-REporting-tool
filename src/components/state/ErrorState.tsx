"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ErrorState({
  title = "Something went wrong",
  description,
  reset
}: {
  title?: string;
  description?: string;
  reset?: () => void;
}) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center rounded-2xl border border-border bg-card p-8 text-center shadow-card">
      <AlertTriangle className="mb-3 h-8 w-8 text-destructive" />
      <h2 className="font-display text-lg">{title}</h2>
      {description ? (
        <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      ) : null}
      {reset ? (
        <Button className="mt-5" type="button" onClick={reset}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}
