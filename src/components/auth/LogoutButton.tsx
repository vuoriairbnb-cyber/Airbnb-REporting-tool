"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export function LogoutButton({
  variant = "outline",
  size = "sm",
  className
}: {
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}) {
  const router = useRouter();
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
      setError(serverError?.error ?? browserError?.message ?? "Could not log out.");
      return;
    }

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
        <LogOut className="h-4 w-4" />
        {isPending ? "Logging out..." : "Log out"}
      </Button>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
