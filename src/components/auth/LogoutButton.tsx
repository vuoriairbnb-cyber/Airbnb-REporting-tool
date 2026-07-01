"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LogOut } from "lucide-react";
import { useFeedback } from "@/components/feedback/FeedbackProvider";
import { FailureState } from "@/components/state/FailureState";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export function LogoutButton({
  variant = "outline",
  size = "sm",
  className,
  labels = {
    logout: "Log out",
    loggingOut: "Logging out...",
    error: "Could not log out."
  }
}: {
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  labels?: {
    logout: string;
    loggingOut: string;
    error: string;
  };
}) {
  const router = useRouter();
  const feedback = useFeedback();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogout() {
    setError(null);
    setIsPending(true);

    const supabase = createClient();
    const [browserResult, serverResult] = await Promise.allSettled([
      supabase.auth.signOut(),
      fetch("/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      })
    ]);

    const browserError =
      browserResult.status === "fulfilled" ? browserResult.value.error : null;
    const serverError =
      serverResult.status === "fulfilled" && !serverResult.value.ok
        ? await serverResult.value.json().catch(() => null)
        : null;

    setIsPending(false);

    if (browserError || serverError) {
      const message = serverError?.error ?? browserError?.message ?? labels.error;
      setError(message);
      feedback.error({ title: labels.error, description: message });
      return;
    }

    feedback.success({ title: labels.logout });
    router.replace("/login");
    router.refresh();
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant={variant}
        size={size}
        className={className}
        onClick={handleLogout}
        disabled={isPending}
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <LogOut className="h-4 w-4" />
        )}
        {isPending ? labels.loggingOut : labels.logout}
      </Button>
      {error ? (
        <FailureState variant="inline" title={labels.error} description={error} />
      ) : null}
    </div>
  );
}
