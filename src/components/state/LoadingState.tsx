import { cn } from "@/lib/utils";

export function LoadingState({
  label = "Loading",
  description,
  variant = "card"
}: {
  label?: string;
  description?: string;
  variant?: "page" | "card" | "inline";
}) {
  if (variant === "inline") {
    return (
      <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        {label}
      </span>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-border bg-card p-6 text-center shadow-card",
        variant === "page" ? "min-h-[50vh]" : "min-h-40"
      )}
    >
      <div className="flex items-center gap-3 text-sm font-medium text-foreground">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <span>{label}</span>
      </div>
      {description ? (
        <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      ) : null}
    </div>
  );
}
