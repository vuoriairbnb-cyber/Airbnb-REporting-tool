"use client";

import { FailureState } from "@/components/state/FailureState";

export function ErrorState({
  title = "Something went wrong",
  description,
  reset
}: {
  title?: string;
  description?: string;
  reset?: () => void;
}) {
  return (
    <FailureState
      title={title}
      description={description}
      action={reset ? { label: "Try again", onClick: reset } : undefined}
    />
  );
}
