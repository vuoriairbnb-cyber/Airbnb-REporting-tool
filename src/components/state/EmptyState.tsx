import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel
}: {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
}) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center rounded-lg border bg-background p-6 text-center">
      {Icon ? <Icon className="mb-3 h-6 w-6 text-primary" /> : null}
      <h2 className="text-base font-semibold">{title}</h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
        {description}
      </p>
      {actionLabel ? (
        <Button className="mt-5" type="button">
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
