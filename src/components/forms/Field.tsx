import { cn } from "@/lib/utils";

export function Field({
  label,
  children,
  className
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("grid gap-2 text-sm font-medium", className)}>
      <span className="text-[11px] uppercase tracking-normal text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}

export const inputClassName =
  "h-11 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60";

export const textareaClassName =
  "min-h-24 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20";

export const selectClassName = inputClassName;
