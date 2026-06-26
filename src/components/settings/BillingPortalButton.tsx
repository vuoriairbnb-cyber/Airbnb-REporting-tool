"use client";

import { useState } from "react";
import { ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ButtonProps } from "@/components/ui/button";

type BillingPortalButtonProps = {
  disabled?: boolean;
  label?: string;
  variant?: ButtonProps["variant"];
  className?: string;
};

export function BillingPortalButton({
  disabled = false,
  label = "Manage billing",
  variant,
  className
}: BillingPortalButtonProps) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleOpenPortal() {
    setIsPending(true);
    setError(null);

    try {
      const response = await fetch("/api/stripe/create-portal-session", {
        method: "POST"
      });
      const body = await response.json().catch(() => null);

      if (!response.ok || !body?.data?.url) {
        throw new Error(body?.error ?? "Could not open billing portal.");
      }

      window.location.assign(body.data.url);
    } catch (portalError) {
      setError(
        portalError instanceof Error
          ? portalError.message
          : "Could not open billing portal."
      );
      setIsPending(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button
        className={className}
        disabled={disabled || isPending}
        onClick={handleOpenPortal}
        variant={variant}
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <ExternalLink className="h-4 w-4" />
        )}
        {isPending ? "Opening portal..." : label}
      </Button>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
