import Link from "next/link";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  CreditCard,
  ShieldAlert,
  Smartphone,
  Sparkles,
  Tag,
  Trash2,
  User
} from "lucide-react";
import { Pill } from "@/components/app/primitives";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { Button } from "@/components/ui/button";
import { DEFAULT_EXPENSE_CATEGORIES } from "@/lib/constants/categories";
import { getEntitlements } from "@/lib/stripe/entitlements";
import { createClient } from "@/lib/supabase/server";
import { AiConsentControl } from "@/components/settings/AiConsentControl";
import { DisclaimerStatusControl } from "@/components/settings/DisclaimerStatusControl";
import type { SupabaseReportingClient } from "@/server/reporting/db";

async function getAccountInfo() {
  try {
    const supabase = await createClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    let aiProcessingConsentAt: string | null = null;
    let disclaimerAcceptedAt: string | null = null;
    let defaultCurrency = "EUR";
    let billingPlan = "Free";
    let billingStatus = "none";
    let billingGateDisabled = false;

    if (user?.id) {
      const { data: profile } = await (supabase as unknown as SupabaseReportingClient)
        .from("profiles")
        .select("ai_processing_consent_at,disclaimer_accepted_at,default_currency")
        .eq("id", user.id)
        .single();

      aiProcessingConsentAt =
        (profile as { ai_processing_consent_at?: string | null } | null)
          ?.ai_processing_consent_at ?? null;
      disclaimerAcceptedAt =
        (
          profile as {
            disclaimer_accepted_at?: string | null;
          } | null
        )?.disclaimer_accepted_at ?? null;
      defaultCurrency =
        (
          profile as {
            default_currency?: string | null;
          } | null
        )?.default_currency ?? "EUR";

      const entitlements = await getEntitlements(user.id);
      billingPlan = entitlements.planLabel;
      billingStatus = entitlements.status.replaceAll("_", " ");
      billingGateDisabled = entitlements.isBillingGateDisabled;
    }

    return {
      email: user?.email ?? "Not signed in",
      name:
        (user?.user_metadata?.full_name as string | undefined) ??
        (user?.user_metadata?.name as string | undefined) ??
        "HostReport user",
      aiProcessingConsentAt,
      disclaimerAcceptedAt,
      defaultCurrency,
      billingPlan,
      billingStatus,
      billingGateDisabled
    };
  } catch {
    return {
      email: "Account unavailable",
      name: "HostReport user",
      aiProcessingConsentAt: null,
      disclaimerAcceptedAt: null,
      defaultCurrency: "EUR",
      billingPlan: "Free",
      billingStatus: "none",
      billingGateDisabled: false
    };
  }
}

export default async function SettingsPage() {
  const account = await getAccountInfo();

  return (
    <div className="space-y-5">
      <div className="min-w-0">
        <p className="text-sm text-muted-foreground">Workspace settings</p>
        <h1 className="mt-1 font-display text-2xl leading-tight md:text-3xl">Settings</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Manage account details, billing, categories, consent, disclaimers and the mobile
          install guide for reporting preparation.
        </p>
      </div>

      <SettingsSection
        icon={User}
        title="Profile"
        description="Your account and workspace details."
        action={<LogoutButton />}
      >
        <div className="grid gap-3 md:grid-cols-2">
          <ReadOnlyField label="Name" value={account.name} />
          <ReadOnlyField label="Email" value={account.email} />
          <ReadOnlyField label="Workspace" value="HostReport workspace" />
          <ReadOnlyField label="Currency" value={account.defaultCurrency} />
        </div>
      </SettingsSection>

      <SettingsSection
        icon={CreditCard}
        title="Billing"
        description="Current subscription plan, billing status and Stripe test-mode tools."
        action={
          <Pill tone="bg-primary/10 text-primary">
            {account.billingPlan} - {account.billingStatus}
          </Pill>
        }
      >
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface/60 p-4">
          <div>
            <p className="font-medium">Subscription status</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {account.billingGateDisabled
                ? "Billing gate bypass is enabled in development. You can still review plan and status safely."
                : "Billing limits follow the active plan and status shown for this workspace."}
            </p>
          </div>
          <Button asChild>
            <Link href="/app/settings/billing">Manage billing</Link>
          </Button>
        </div>
      </SettingsSection>

      <SettingsSection
        icon={Tag}
        title="Categories"
        description="Manage expense categories used for expense allocation and reports."
        action={
          <Button asChild variant="outline" size="sm">
            <Link href="/app/settings/categories">Manage</Link>
          </Button>
        }
      >
        <div className="flex flex-wrap gap-2">
          {DEFAULT_EXPENSE_CATEGORIES.slice(0, 10).map((category) => (
            <span
              key={category}
              className="rounded-full border border-border bg-card px-3 py-1.5 text-xs"
            >
              {category}
            </span>
          ))}
          <span className="rounded-full border border-dashed border-border px-3 py-1.5 text-xs text-muted-foreground">
            Custom categories later
          </span>
        </div>
      </SettingsSection>

      <SettingsSection
        icon={Sparkles}
        title="AI processing consent"
        description="Controls for AI receipt parsing and extraction review."
        action={
          account.aiProcessingConsentAt ? (
            <Pill tone="bg-primary/10 text-primary">Enabled</Pill>
          ) : (
            <Pill tone="bg-muted text-muted-foreground">Not enabled</Pill>
          )
        }
      >
        <AiConsentControl initialConsentAt={account.aiProcessingConsentAt} />
        <StatusRow
          label="Plus scan"
          description="More careful extraction for unclear receipts."
          status="Preview"
          tone="bg-warm/20 text-warm-foreground"
        />
      </SettingsSection>

      <SettingsSection
        icon={ShieldAlert}
        title="Disclaimer status"
        description="Acknowledgement status for tax-preparation reports."
        action={
          account.disclaimerAcceptedAt ? (
            <Pill tone="bg-primary/10 text-primary">Accepted</Pill>
          ) : (
            <Pill tone="bg-warm/20 text-warm-foreground">Required</Pill>
          )
        }
      >
        <DisclaimerStatusControl initialAcceptedAt={account.disclaimerAcceptedAt} />
      </SettingsSection>

      <SettingsSection
        icon={Smartphone}
        title="Add to Home Screen"
        description="Use HostReport like a mobile app for faster receipt capture."
        action={
          <Button asChild variant="outline" size="sm">
            <Link href="/app/settings/mobile-install">Open guide</Link>
          </Button>
        }
      >
        <div className="grid gap-4 md:grid-cols-2">
          <InstallGuide
            os="iPhone"
            steps={[
              "Open this page in Safari",
              "Tap Share",
              "Tap Add to Home Screen",
              "Confirm Add"
            ]}
          />
          <InstallGuide
            os="Android"
            steps={[
              "Open in Chrome",
              "Tap menu",
              "Tap Add to Home screen or Install app",
              "Confirm"
            ]}
          />
        </div>
      </SettingsSection>

      <SettingsSection
        icon={Trash2}
        title="Privacy and data deletion"
        description="Review privacy information and data handling notes."
        action={<Pill tone="bg-muted text-muted-foreground">Manual request</Pill>}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface/60 p-4">
          <div>
            <p className="font-medium">Data deletion</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Self-serve deletion is not connected yet. During private beta, account and
              workspace deletion requests are handled manually and storage files remain
              private while the request is reviewed.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/privacy">Privacy</Link>
          </Button>
        </div>
      </SettingsSection>
    </div>
  );
}

function SettingsSection({
  icon: Icon,
  title,
  description,
  action,
  children
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-card md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
            <Icon className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="font-display text-lg">{title}</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
          </div>
        </div>
        {action}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-medium uppercase tracking-normal text-muted-foreground">
        {label}
      </span>
      <input
        readOnly
        value={value}
        className="h-11 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none"
      />
    </label>
  );
}

function StatusRow({
  label,
  description,
  status,
  tone
}: {
  label: string;
  description: string;
  status: string;
  tone: string;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border py-3 last:border-0">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      </div>
      <Pill tone={tone}>{status}</Pill>
    </div>
  );
}

function InstallGuide({ os, steps }: { os: string; steps: string[] }) {
  return (
    <div className="rounded-xl border border-border bg-surface/60 p-4">
      <p className="font-medium">{os}</p>
      <ol className="mt-3 space-y-2 text-sm text-muted-foreground">
        {steps.map((step, index) => (
          <li key={step} className="flex gap-2">
            <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary/10 text-[10px] font-medium text-primary">
              {index + 1}
            </span>
            {step}
          </li>
        ))}
      </ol>
    </div>
  );
}
