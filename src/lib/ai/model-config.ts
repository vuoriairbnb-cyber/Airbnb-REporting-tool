import "server-only";

import type { AiScanMode } from "@/lib/ai/types";

export function getAiModelForScanMode(mode: AiScanMode): string {
  if (mode === "standard") {
    return (
      process.env.AI_STANDARD_SCAN_MODEL ?? process.env.AI_FAST_MODEL ?? "gpt-5.4-mini"
    );
  }

  if (mode === "plus") {
    return process.env.AI_PLUS_SCAN_MODEL ?? process.env.AI_ACCURATE_MODEL ?? "gpt-5.4";
  }

  return (
    process.env.AI_PRO_SCAN_MODEL ??
    process.env.AI_PLUS_SCAN_MODEL ??
    process.env.AI_ACCURATE_MODEL ??
    "gpt-5.5"
  );
}
