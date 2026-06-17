"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Archive, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function RecordActions({
  endpoint,
  label = "Archive"
}: {
  endpoint: string;
  label?: "Archive" | "Delete" | "Deactivate";
}) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  async function handleDelete() {
    setIsPending(true);

    try {
      const response = await fetch(endpoint, { method: "DELETE" });
      if (!response.ok) throw new Error("Request failed.");
      router.refresh();
    } finally {
      setIsPending(false);
    }
  }

  const Icon = label === "Delete" ? Trash2 : Archive;

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleDelete}
      disabled={isPending}
    >
      <Icon className="h-4 w-4" />
      {label}
    </Button>
  );
}
