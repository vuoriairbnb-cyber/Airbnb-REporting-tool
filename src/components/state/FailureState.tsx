"use client";

import Link from "next/link";
import type { Route } from "next";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type StateAction = {
  label: string;
  href?: string;
  onClick?: () => void;
};

export function FailureState({
  title = "Something went wrong",
  description,
  action,
  variant = "card"
}: {
  title?: string;
  description?: string;
  action?: StateAction;
  variant?: "page" | "card" | "inline";
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-destructive/20 bg-destructive/5 p-8 text-center shadow-card",
        variant === "page" && "min-h-[50vh]",
        variant === "inline" && "min-h-0 items-start p-4 text-left shadow-none"
      )}
    >
      <AlertTriangle
        className={cn("mb-3 h-8 w-8 text-destructive", variant === "inline" && "h-5 w-5")}
      />
      <h2 className="font-display text-lg">{title}</h2>
      {description ? (
        <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      ) : null}
      {action?.href ? (
        <Button asChild className="mt-5" type="button">
          <Link href={action.href as Route}>{action.label}</Link>
        </Button>
      ) : action?.onClick ? (
        <Button className="mt-5" type="button" onClick={action.onClick}>
          {action.label}
        </Button>
      ) : null}
    </div>
  );
}
