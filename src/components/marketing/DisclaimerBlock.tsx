import { ShieldAlert } from "lucide-react";
import { DISCLAIMER_TEXT } from "@/lib/constants/disclaimer";

export function DisclaimerBlock({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`flex gap-3 rounded-2xl border border-warm/30 bg-warm/10 ${
        compact ? "p-3" : "p-5"
      }`}
    >
      <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-warm" />
      <div className="min-w-0">
        <p className={`font-medium ${compact ? "text-sm" : "text-base"}`}>
          This app helps organize information for reporting preparation.
        </p>
        <p className="mt-1 text-sm text-muted-foreground">{DISCLAIMER_TEXT}</p>
      </div>
    </div>
  );
}
