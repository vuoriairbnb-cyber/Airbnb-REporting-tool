import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function DashboardCard({
  label,
  value,
  hint,
  tone = "default"
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: "default" | "primary" | "warm";
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border p-5 shadow-card",
        tone === "primary" && "bg-primary text-primary-foreground",
        tone === "warm" && "bg-warm/10",
        tone === "default" && "bg-card"
      )}
    >
      <p
        className={cn(
          "text-xs uppercase tracking-normal",
          tone === "primary" ? "text-primary-foreground/70" : "text-muted-foreground"
        )}
      >
        {label}
      </p>
      <p className="mt-2 font-display text-2xl md:text-3xl">{value}</p>
      {hint ? (
        <p
          className={cn(
            "mt-1 text-xs",
            tone === "primary" ? "text-primary-foreground/80" : "text-muted-foreground"
          )}
        >
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function SectionCard({
  title,
  action,
  children,
  className
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-border bg-card p-5 shadow-card",
        className
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-lg">{title}</h2>
        {action}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function AppEmptyState({
  title,
  body,
  action
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-surface/60 p-10 text-center">
      <p className="font-display text-lg">{title}</p>
      <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">{body}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function Pill({
  tone = "bg-muted text-muted-foreground",
  children
}: {
  tone?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium",
        tone
      )}
    >
      {children}
    </span>
  );
}
