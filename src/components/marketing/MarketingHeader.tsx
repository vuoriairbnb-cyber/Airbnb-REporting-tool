"use client";

import Link from "next/link";
import { useState } from "react";
import { LogOut, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { Logo } from "@/components/Logo";
import type { Dictionary, Locale } from "@/lib/i18n";

const links = [
  { href: "/features", labelKey: "features" },
  { href: "/pricing", labelKey: "pricing" },
  { href: "/disclaimer", labelKey: "disclaimer" },
  { href: "/privacy", labelKey: "privacy" }
] as const;

type MarketingHeaderProps = {
  isAuthenticated?: boolean;
  locale: Locale;
  labels: {
    language: { en: string; fi: string; aria: string };
    nav: Dictionary["nav"];
  };
};

export function MarketingHeader({
  isAuthenticated = false,
  locale,
  labels
}: MarketingHeaderProps) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5">
        <Logo />
        <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="transition-colors hover:text-foreground"
            >
              {labels.nav[link.labelKey] ?? link.labelKey}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          <LanguageSwitcher locale={locale} labels={labels.language} compact />
          {isAuthenticated ? (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/app/dashboard">{labels.nav.dashboard}</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href="/auth/logout">
                  <LogOut className="h-4 w-4" />
                  {labels.nav.logout}
                </Link>
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Link href="/login">{labels.nav.login}</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/signup">{labels.nav.getStarted}</Link>
              </Button>
            </>
          )}
        </div>
        <button
          type="button"
          className="grid h-10 w-10 place-items-center rounded-full border border-border md:hidden"
          aria-label="Menu"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {open ? (
        <div className="border-t border-border bg-background md:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-1 px-5 py-3">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-lg px-3 py-2 text-sm hover:bg-muted"
                onClick={() => setOpen(false)}
              >
                {labels.nav[link.labelKey] ?? link.labelKey}
              </Link>
            ))}
            <div className="px-3 py-2">
              <LanguageSwitcher locale={locale} labels={labels.language} />
            </div>
            {isAuthenticated ? (
              <div className="mt-2 grid grid-cols-2 gap-2 border-t border-border pt-3">
                <Button asChild variant="outline" size="sm">
                  <Link href="/app/dashboard" onClick={() => setOpen(false)}>
                    {labels.nav.dashboard}
                  </Link>
                </Button>
                <Button asChild size="sm">
                  <Link href="/auth/logout" onClick={() => setOpen(false)}>
                    {labels.nav.logout}
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="mt-2 grid grid-cols-2 gap-2 border-t border-border pt-3">
                <Button asChild variant="outline" size="sm">
                  <Link href="/login" onClick={() => setOpen(false)}>
                    {labels.nav.login}
                  </Link>
                </Button>
                <Button asChild size="sm">
                  <Link href="/signup" onClick={() => setOpen(false)}>
                    {labels.nav.getStarted}
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </header>
  );
}
