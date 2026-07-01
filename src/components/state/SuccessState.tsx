"use client";

import Link from "next/link";
import type { Route } from "next";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type StateAction = {
  label: string;
  href?: string;
  onClick?: () => void;
};

export function SuccessState({
  title = "Success",
  description,
  action
}: {
  title?: string;
  description?: string;
  action?: StateAction;
}) {
  return (
    <div className="flex min-h-40 flex-col items-center justify-center rounded-2xl border border-success/20 bg-success/10 p-8 text-center shadow-card">
      <CheckCircle2 className="mb-3 h-8 w-8 text-success" />
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
