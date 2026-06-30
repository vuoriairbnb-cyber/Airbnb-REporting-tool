"use client";

import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Logo } from "@/components/Logo";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { Button } from "@/components/ui/button";
import type { Dictionary, Locale } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/client";

type AuthMode = "login" | "signup";

const inputClassName =
  "h-12 w-full rounded-xl border border-border bg-card px-4 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10";

export function AuthForm({
  mode,
  next = "/app/dashboard",
  locale,
  labels
}: {
  mode: AuthMode;
  next?: string;
  locale: Locale;
  labels: {
    language: { en: string; fi: string; aria: string };
    auth: Dictionary["auth"];
    nav: Dictionary["nav"];
  };
}) {
  const router = useRouter();
  const isLogin = mode === "login";
  const nextPath = getSafeNextPath(next);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setIsPending(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const fullName = String(formData.get("full_name") ?? "").trim();
    const supabase = createClient();

    if (isLogin) {
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      setIsPending(false);

      if (loginError) {
        setError(loginError.message);
        return;
      }

      router.replace(nextPath as Route);
      router.refresh();
      return;
    }

    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;
    const { data, error: signupError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName
        },
        emailRedirectTo: redirectTo
      }
    });

    setIsPending(false);

    if (signupError) {
      setError(signupError.message);
      return;
    }

    if (data.session) {
      router.replace("/pending-approval" as Route);
      router.refresh();
      return;
    }

    setNotice(labels.auth.checkEmail);
  }

  return (
    <main className="grid min-h-screen bg-background md:grid-cols-2">
      <section className="flex flex-col p-6 md:p-10">
        <div className="flex items-center justify-between gap-3">
          <Logo />
          <LanguageSwitcher locale={locale} labels={labels.language} compact />
        </div>
        <div className="mx-auto my-auto w-full max-w-sm py-10">
          <h1 className="text-3xl">
            {isLogin ? labels.auth.welcomeBack : labels.auth.createAccount}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {isLogin ? labels.auth.loginBody : labels.auth.signupBody}
          </p>

          <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
            {!isLogin ? (
              <Field label="Name">
                <input
                  type="text"
                  name="full_name"
                  placeholder="Anna Korhonen"
                  className={inputClassName}
                  autoComplete="name"
                />
              </Field>
            ) : null}
            <Field label={labels.auth.email}>
              <input
                type="email"
                name="email"
                placeholder="you@example.com"
                className={inputClassName}
                autoComplete="email"
                required
              />
            </Field>
            <Field label={labels.auth.password}>
              <input
                type="password"
                name="password"
                placeholder="Password"
                className={inputClassName}
                autoComplete={isLogin ? "current-password" : "new-password"}
                minLength={6}
                required
              />
            </Field>

            {error ? (
              <div className="rounded-xl border border-destructive/25 bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            ) : null}

            {notice ? (
              <div className="rounded-xl border border-primary/20 bg-primary/10 p-3 text-sm leading-6 text-primary">
                {notice}
              </div>
            ) : null}

            <Button className="w-full" size="lg" type="submit" disabled={isPending}>
              {isPending
                ? isLogin
                  ? "Logging in..."
                  : "Creating account..."
                : isLogin
                  ? labels.auth.loginButton
                  : labels.auth.signupButton}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {isLogin ? (
              <>
                New here?{" "}
                <Link href="/signup" className="text-primary hover:underline">
                  {labels.auth.signupButton}
                </Link>
              </>
            ) : (
              <>
                Already registered?{" "}
                <Link href="/login" className="text-primary hover:underline">
                  {labels.nav.login}
                </Link>
              </>
            )}
          </p>
          <p className="mt-8 text-center text-xs leading-5 text-muted-foreground">
            By continuing you acknowledge this app is not a tax, legal, accounting or
            bookkeeping service. Users are responsible for verifying what they report.
          </p>
        </div>
      </section>

      <section className="relative hidden overflow-hidden bg-primary p-10 text-primary-foreground md:block">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,oklch(var(--primary-foreground)/0.22),transparent_60%)]" />
        <div className="relative flex h-full flex-col">
          <div className="my-auto max-w-md">
            <p className="text-xs uppercase opacity-70">HostReport</p>
            <p className="mt-3 text-3xl leading-tight">
              {isLogin
                ? "Reporting preparation feels lighter when receipts and allocations are already organized."
                : "Snap receipts, review extracted fields and keep candidate reportable amounts ready for export."}
            </p>
            <p className="mt-4 text-sm opacity-80">
              {isLogin
                ? "Built for small short-term rental hosts."
                : "Built for hosts who want less spreadsheet cleanup."}
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}

function getSafeNextPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/app/dashboard";
  }

  return value;
}
