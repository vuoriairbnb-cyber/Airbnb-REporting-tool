import { parseReceiptWithMock } from "@/lib/ai/providers/mock";
import type { ReceiptParser } from "@/lib/ai/types";

export function getReceiptParser(): ReceiptParser {
  const provider = process.env.AI_PROVIDER ?? "mock";

  if (provider === "mock") return parseReceiptWithMock;

  throw new Error(`AI provider '${provider}' is not implemented yet.`);
}
