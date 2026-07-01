"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, CheckCircle2, Loader2, ShieldAlert, Sparkles } from "lucide-react";
import { useFeedback } from "@/components/feedback/FeedbackProvider";
import { FailureState } from "@/components/state/FailureState";
import { Button } from "@/components/ui/button";
import { Field, inputClassName } from "@/components/forms/Field";
import { parseApiError } from "@/lib/api/client";
import type { OnboardingStatus } from "@/server/reporting/onboarding";

const DISCLAIMER_TEXT =
  "This app helps organize rental income, expenses, receipts and allocation assumptions for reporting preparation. It does not provide tax, legal, accounting or bookkeeping advice. You are responsible for verifying what you report.";

const AI_CONSENT_TEXT =
  "AI processing helps extract receipt details. You must review the results before saving them.";

export function OnboardingForm({ status }: { status: OnboardingStatus }) {
  const router = useRouter();
  const feedback = useFeedback();
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const needsProperty = status.propertyCount === 0;
  const needsDisclaimer = !status.disclaimerAcceptedAt;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsPending(true);

    const formData = new FormData(event.currentTarget);
    const property = needsProperty
      ? {
          name: formData.get("name"),
          country: formData.get("country"),
          city: formData.get("city"),
          address: formData.get("address"),
          currency: formData.get("currency") || "EUR",
          default_allocation_method: "full_rental_use",
          default_allocation_percentage:
            formData.get("default_allocation_percentage") || 100,
          is_active: true
        }
      : undefined;
    const response = await fetch("/api/onboarding/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        acceptDisclaimer: formData.get("acceptDisclaimer") === "on",
        enableAiProcessing: formData.get("enableAiProcessing") === "on",
        property
      })
    });

    setIsPending(false);

    if (!response.ok) {
      setError(await parseApiError(response, "Could not complete onboarding."));
      return;
    }

    feedback.success({ title: "Setup complete." });
    router.replace("/app/dashboard");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="min-w-0">
        <p className="text-sm text-muted-foreground">Workspace setup</p>
        <h1 className="mt-1 font-display text-2xl leading-tight md:text-3xl">
          Finish onboarding
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Accept the reporting preparation disclaimer and add your first rental property.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <section className="rounded-2xl border border-border bg-card p-5 shadow-card md:p-6">
          <div className="flex gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-warm/20 text-warm">
              <ShieldAlert className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="font-display text-lg">Disclaimer</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {DISCLAIMER_TEXT}
              </p>
              {status.disclaimerAcceptedAt ? (
                <p className="mt-3 flex items-center gap-2 text-sm text-primary">
                  <CheckCircle2 className="h-4 w-4" />
                  Disclaimer accepted
                </p>
              ) : (
                <label className="mt-4 flex items-start gap-3 text-sm">
                  <input
                    name="acceptDisclaimer"
                    type="checkbox"
                    required={needsDisclaimer}
                    className="mt-1"
                  />
                  <span>I understand and accept this disclaimer.</span>
                </label>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 shadow-card md:p-6">
          <div className="flex gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
              <Sparkles className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="font-display text-lg">AI processing consent</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {AI_CONSENT_TEXT}
              </p>
              {status.aiProcessingConsentAt ? (
                <p className="mt-3 flex items-center gap-2 text-sm text-primary">
                  <CheckCircle2 className="h-4 w-4" />
                  AI processing enabled
                </p>
              ) : (
                <label className="mt-4 flex items-start gap-3 text-sm">
                  <input name="enableAiProcessing" type="checkbox" className="mt-1" />
                  <span>Enable AI processing for receipt extraction.</span>
                </label>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 shadow-card md:p-6">
          <div className="flex gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
              <Building2 className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-display text-lg">First property</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Add the first rental unit used for income, expenses and expense
                allocation.
              </p>

              {needsProperty ? (
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <Field label="Property name">
                    <input className={inputClassName} name="name" required />
                  </Field>
                  <Field label="Country">
                    <input
                      className={inputClassName}
                      name="country"
                      defaultValue="FI"
                      required
                    />
                  </Field>
                  <Field label="City">
                    <input className={inputClassName} name="city" />
                  </Field>
                  <Field label="Address">
                    <input className={inputClassName} name="address" />
                  </Field>
                  <Field label="Currency">
                    <input
                      className={inputClassName}
                      name="currency"
                      defaultValue="EUR"
                      maxLength={3}
                      required
                    />
                  </Field>
                  <Field label="Default allocation %">
                    <input
                      className={inputClassName}
                      type="number"
                      name="default_allocation_percentage"
                      min="0"
                      max="100"
                      step="0.01"
                      defaultValue={100}
                    />
                  </Field>
                </div>
              ) : (
                <p className="mt-3 flex items-center gap-2 text-sm text-primary">
                  <CheckCircle2 className="h-4 w-4" />
                  First property already exists
                </p>
              )}
            </div>
          </div>
        </section>

        {error ? (
          <FailureState
            variant="inline"
            title="Could not finish setup"
            description={error}
          />
        ) : null}

        <Button type="submit" size="lg" disabled={isPending}>
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {isPending ? "Finishing setup..." : "Finish setup"}
        </Button>
      </form>
    </div>
  );
}
