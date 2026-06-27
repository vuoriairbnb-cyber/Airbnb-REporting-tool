import type { AiScanMode, AnyAiScanMode } from "@/lib/ai/types";

const scanModeMap: Record<AnyAiScanMode, AiScanMode> = {
  fast: "standard",
  accurate: "plus",
  standard: "standard",
  plus: "plus",
  pro: "pro"
};

export function normalizeAiScanMode(mode: AnyAiScanMode): AiScanMode {
  return scanModeMap[mode];
}

export function isAiScanMode(value: unknown): value is AnyAiScanMode {
  return (
    value === "fast" ||
    value === "accurate" ||
    value === "standard" ||
    value === "plus" ||
    value === "pro"
  );
}
