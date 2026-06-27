import { z } from "zod";
import { normalizeReceiptResult, type AiReceiptPayload } from "@/lib/ai/normalize";
import {
  buildReceiptParserUserPrompt,
  RECEIPT_PARSER_SYSTEM_PROMPT
} from "@/lib/ai/prompts/receipt-parser";
import { receiptParserJsonSchema } from "@/lib/ai/schemas/receipt.schema";
import { getAiModelForScanMode } from "@/lib/ai/model-config";
import type { ReceiptParser } from "@/lib/ai/types";

const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";

const openAiResponseSchema = z.object({
  output_text: z.string().optional(),
  output: z
    .array(
      z.object({
        content: z
          .array(
            z.object({
              type: z.string().optional(),
              text: z.string().optional()
            })
          )
          .optional()
      })
    )
    .optional()
});

function getResponseText(response: unknown) {
  const parsed = openAiResponseSchema.parse(response);

  if (parsed.output_text) return parsed.output_text;

  return (
    parsed.output
      ?.flatMap((item) => item.content ?? [])
      .map((content) => content.text)
      .find((text): text is string => Boolean(text)) ?? null
  );
}

function getFileContent(input: Parameters<ReceiptParser>[0]) {
  const fileData = `data:${input.mimeType};base64,${input.fileBuffer.toString("base64")}`;

  if (input.mimeType === "application/pdf") {
    return {
      type: "input_file",
      filename: input.fileName ?? "receipt.pdf",
      file_data: fileData
    };
  }

  return {
    type: "input_image",
    image_url: fileData
  };
}

export const parseReceiptWithOpenAI: ReceiptParser = async (input) => {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OpenAI API key is missing.");
  }

  const model = getAiModelForScanMode(input.scanMode);
  const response = await fetch(OPENAI_RESPONSES_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: [
                RECEIPT_PARSER_SYSTEM_PROMPT,
                "",
                buildReceiptParserUserPrompt({
                  countryHint: input.localeHint,
                  currencyHint: input.currencyHint,
                  categories: input.categoryHints
                })
              ].join("\n")
            },
            getFileContent(input)
          ]
        }
      ],
      text: {
        format: {
          type: "json_schema",
          name: "receipt_extraction",
          strict: true,
          schema: receiptParserJsonSchema
        }
      }
    })
  });

  const rawResponse = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      (rawResponse as { error?: { message?: string } } | null)?.error?.message ??
      "OpenAI receipt parsing failed.";

    throw new Error(message);
  }

  const outputText = getResponseText(rawResponse);

  if (!outputText) {
    throw new Error("OpenAI did not return structured receipt data.");
  }

  const payload = JSON.parse(outputText) as AiReceiptPayload;

  return normalizeReceiptResult({
    provider: "openai",
    model,
    scanMode: input.scanMode,
    payload,
    rawResponse
  });
};
