import { parseReceiptWithMock } from "@/lib/ai/providers/mock";
import { parseReceiptWithOpenAI } from "@/lib/ai/providers/openai";
import type { ReceiptParser } from "@/lib/ai/types";

export function getReceiptParser(): ReceiptParser {
  const provider = process.env.AI_PROVIDER ?? "mock";

  if (provider === "mock") return parseReceiptWithMock;
  if (provider === "openai") return parseReceiptWithOpenAI;
  if (provider === "anthropic") {
    throw new Error("Anthropic receipt parsing is not implemented yet.");
  }

  throw new Error(`AI provider '${provider}' is not implemented yet.`);
}

export function getAiProviderName() {
  return process.env.AI_PROVIDER ?? "mock";
}
