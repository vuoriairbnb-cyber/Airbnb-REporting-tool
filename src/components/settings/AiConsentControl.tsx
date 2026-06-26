"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pill } from "@/components/app/primitives";
import { Button } from "@/components/ui/button";

function formatConsentDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric"
  }).format(new Date(value));
}

export function AiConsentControl({
  initialConsentAt
}: {
  initialConsentAt: string | null;
}) {
  const router = useRouter();
  const [consentAt, setConsentAt] = useState(initialConsentAt);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function enableConsent() {
    setError(null);
    setIsPending(true);

    const response = await fetch("/api/settings/ai-consent", {
      method: "POST",
      headers: { "Content-Type": "application/json" }
    });

    setIsPending(false);

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.error ?? "Could not enable AI processing consent.");
      return;
    }

    const body = await response.json();
    setConsentAt(body.data.aiProcessingConsentAt);
    router.refresh();
  }

  return (
    <div className="rounded-xl border border-border bg-surface/60 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium">Use AI for receipt extraction</p>
          <p className="mt-1 max-w-xl text-xs leading-5 text-muted-foreground">
            AI processing helps extract receipt details. You must review the results
            before saving them.
          </p>
          {consentAt ? (
            <p className="mt-2 text-xs text-muted-foreground">
              Enabled on {formatConsentDate(consentAt)}
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {consentAt ? (
            <Pill tone="bg-primary/10 text-primary">Enabled</Pill>
          ) : (
            <Button size="sm" onClick={enableConsent} disabled={isPending}>
              {isPending ? "Enabling..." : "Enable AI processing"}
            </Button>
          )}
        </div>
      </div>
      {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
