"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pill } from "@/components/app/primitives";
import { Button } from "@/components/ui/button";
import { DISCLAIMER_TEXT } from "@/lib/constants/disclaimer";

function formatAcceptedDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric"
  }).format(new Date(value));
}

export function DisclaimerStatusControl({
  initialAcceptedAt
}: {
  initialAcceptedAt: string | null;
}) {
  const router = useRouter();
  const [acceptedAt, setAcceptedAt] = useState(initialAcceptedAt);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function acceptDisclaimer() {
    setError(null);
    setIsPending(true);

    const response = await fetch("/api/settings/disclaimer", {
      method: "POST",
      headers: { "Content-Type": "application/json" }
    });

    setIsPending(false);

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.error ?? "Could not update disclaimer status.");
      return;
    }

    const body = await response.json();
    setAcceptedAt(body.data.disclaimerAcceptedAt);
    router.refresh();
  }

  return (
    <div className="rounded-xl border border-warm/30 bg-warm/10 p-4 text-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium">Disclaimer reminder</p>
          <p className="mt-1 max-w-2xl leading-6 text-muted-foreground">
            {DISCLAIMER_TEXT}
          </p>
          {acceptedAt ? (
            <p className="mt-3 text-xs text-muted-foreground">
              Accepted on {formatAcceptedDate(acceptedAt)}
            </p>
          ) : (
            <p className="mt-3 text-xs text-muted-foreground">
              Report generation stays locked until this disclaimer is accepted.
            </p>
          )}
        </div>
        {acceptedAt ? (
          <Pill tone="bg-primary/10 text-primary">Accepted</Pill>
        ) : (
          <Button size="sm" onClick={acceptDisclaimer} disabled={isPending}>
            {isPending ? "Saving..." : "Accept disclaimer"}
          </Button>
        )}
      </div>
      {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
