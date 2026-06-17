"use client";

import { ErrorState } from "@/components/state/ErrorState";

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="p-4">
      <ErrorState
        description={error.message || "The page could not be loaded."}
        reset={reset}
      />
    </main>
  );
}
