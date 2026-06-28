"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Building2,
  FileText,
  LayoutDashboard,
  Receipt,
  ScanLine,
  Search,
  Settings,
  TrendingUp
} from "lucide-react";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { Logo } from "@/components/Logo";
import type { Dictionary, Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/app/dashboard", labelKey: "dashboard", icon: LayoutDashboard },
  { href: "/app/properties", labelKey: "properties", icon: Building2 },
  { href: "/app/income", labelKey: "income", icon: TrendingUp },
  { href: "/app/expenses", labelKey: "expenses", icon: Receipt },
  { href: "/app/receipts", labelKey: "receipts", icon: ScanLine },
  { href: "/app/reports", labelKey: "reports", icon: FileText },
  { href: "/app/settings", labelKey: "settings", icon: Settings }
] as const;

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

type AppShellLabels = {
  language: { en: string; fi: string; aria: string };
  nav: Dictionary["nav"];
  workspace: string;
};

export function AppShell({
  children,
  locale,
  labels
}: {
  children: React.ReactNode;
  locale: Locale;
  labels: AppShellLabels;
}) {
  const pathname = usePathname();
  const current =
    navItems.find((item) => isActivePath(pathname, item.href)) ?? navItems[0];
  const currentLabel = labels.nav[current.labelKey] ?? current.labelKey;

  return (
    <div className="min-h-screen bg-surface/40">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border bg-card md:flex">
        <div className="flex h-16 items-center border-b border-border px-5">
          <Logo href="/app/dashboard" />
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {navItems.map((item) => {
            const active = isActivePath(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition",
                  active
                    ? "bg-primary/10 font-medium text-primary"
                    : "text-foreground/70 hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {labels.nav[item.labelKey] ?? item.labelKey}
              </Link>
            );
          })}
        </nav>

        <div className="m-3 rounded-2xl border border-border bg-surface p-4">
          <p className="text-xs font-medium">Billing preview</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Stripe billing tools are available in test mode once the billing env values
            are configured.
          </p>
          <Link
            href="/app/settings/billing/plans"
            className="mt-3 block rounded-full bg-primary px-3 py-1.5 text-center text-xs font-medium text-primary-foreground"
          >
            {labels.nav.viewPlans}
          </Link>
        </div>
      </aside>

      <div className="md:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-background/85 px-4 backdrop-blur md:px-8">
          <div className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 md:flex md:justify-between">
            <div className="min-w-0">
              <p className="truncate font-display text-lg leading-tight">
                {currentLabel}
              </p>
              <p className="text-[11px] text-muted-foreground">{labels.workspace}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <div className="hidden md:block">
                <LanguageSwitcher locale={locale} labels={labels.language} compact />
              </div>
              <button
                type="button"
                className="hidden h-9 w-9 place-items-center rounded-full border border-border text-muted-foreground transition hover:bg-muted md:grid"
                aria-label="Search"
              >
                <Search className="h-4 w-4" />
              </button>
              <button
                type="button"
                className="grid h-9 w-9 place-items-center rounded-full border border-border text-muted-foreground transition hover:bg-muted"
                aria-label="Notifications"
              >
                <Bell className="h-4 w-4" />
              </button>
              <Link
                href="/app/settings"
                aria-label="Open settings"
                className="grid h-9 w-9 place-items-center rounded-full bg-warm text-sm font-medium text-warm-foreground transition hover:opacity-90"
              >
                H
              </Link>
              <div className="hidden md:block">
                <LogoutButton
                  size="sm"
                  labels={{
                    logout: labels.nav.logout,
                    loggingOut: labels.nav.loggingOut,
                    error: "Could not log out."
                  }}
                />
              </div>
            </div>
          </div>
        </header>

        <main className="px-4 pb-28 pt-6 md:px-8 md:pb-12">{children}</main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 backdrop-blur md:hidden">
        <div className="grid grid-cols-6">
          {[
            navItems[0],
            navItems[1],
            navItems[2],
            navItems[3],
            navItems[4],
            navItems[6]
          ].map((item) => {
            const active = isActivePath(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 py-2.5 text-[10px]",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                {labels.nav[item.labelKey] ?? item.labelKey}
              </Link>
            );
          })}
        </div>
        <div className="h-[env(safe-area-inset-bottom)]" />
      </nav>
    </div>
  );
}
