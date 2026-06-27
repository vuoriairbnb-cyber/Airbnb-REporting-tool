export type AiScanMode = "standard" | "plus" | "pro";
export type LegacyAiScanMode = "fast" | "accurate";
export type ScanMode = AiScanMode;
export type AnyAiScanMode = AiScanMode | LegacyAiScanMode;
export type AiProviderName = "mock" | "openai" | "anthropic";
export type AiProvider = AiProviderName;

export type ParsedReceiptItem = {
  id: string;
  description: string;
  quantity: number | null;
  amount: number | null;
};

export type ParseReceiptInput = {
  fileBuffer: Buffer;
  mimeType: string;
  fileName?: string;
  scanMode: AiScanMode;
  localeHint?: string;
  currencyHint?: string;
  categoryHints: string[];
};

export type ParseReceiptResult = {
  provider: AiProvider;
  model: string;
  scanMode: AiScanMode;
  receipt: {
    date: string | null;
    vendor: string | null;
    total_amount: number | null;
    tax_amount: number | null;
    currency: string | null;
    payment_method: string | null;
    last4: string | null;
    suggested_category: string | null;
    items: ParsedReceiptItem[];
    confidence: number;
    warnings: string[];
  };
  rawResponse: unknown;
};

export type ReceiptParser = (input: ParseReceiptInput) => Promise<ParseReceiptResult>;
