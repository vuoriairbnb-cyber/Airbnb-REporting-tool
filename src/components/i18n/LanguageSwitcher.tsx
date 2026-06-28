"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { Locale } from "@/lib/i18n";

export function LanguageSwitcher({
  locale,
  labels,
  compact = false
}: {
  locale: Locale;
  labels: { en: string; fi: string; aria: string };
  compact?: boolean;
}) {
  const router = useRouter();
  const [pendingLocale, setPendingLocale] = useState<Locale | null>(null);

  async function updateLanguage(nextLocale: Locale) {
    if (nextLocale === locale || pendingLocale) return;

    setPendingLocale(nextLocale);

    await fetch("/api/settings/language", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ language: nextLocale })
    }).catch(() => null);

    setPendingLocale(null);
    router.refresh();
  }

  return (
    <div
      className={cn(
        "inline-grid grid-cols-2 rounded-full border border-border bg-card p-0.5 text-xs shadow-soft",
        compact ? "h-8" : "h-9"
      )}
      aria-label={labels.aria}
    >
      {(["en", "fi"] as const).map((option) => {
        const active = option === locale;

        return (
          <button
            key={option}
            type="button"
            disabled={Boolean(pendingLocale)}
            onClick={() => updateLanguage(option)}
            className={cn(
              "rounded-full px-2.5 font-medium transition",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
              pendingLocale === option ? "opacity-60" : ""
            )}
          >
            {option === "en" ? labels.en : labels.fi}
          </button>
        );
      })}
    </div>
  );
}
