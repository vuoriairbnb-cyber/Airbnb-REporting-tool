import { createClient as createServerClient } from "@/lib/supabase/server";
import { DISCLAIMER_TEXT } from "@/lib/constants/disclaimer";
import type {
  ExpenseEntryRow,
  IncomeEntryRow,
  ReceiptRow,
  ReportRow,
  ReportType
} from "@/server/reporting/types";

type ReportFilters = {
  dateFrom: string;
  dateTo: string;
  propertyId: string | null;
  categoryId: string | null;
};

type ProfileSummary = {
  full_name: string | null;
  company_name: string | null;
  country: string | null;
  default_currency: string;
  disclaimer_accepted_at: string | null;
};

type ReportReceiptRow = ReceiptRow & {
  source_documents?: {
    id: string;
    property_id: string | null;
    original_file_path: string;
    original_file_name: string | null;
    mime_type: string | null;
    created_at: string;
    properties?: { name: string } | null;
  } | null;
  expense_entries?:
    | (ExpenseEntryRow & {
        allocation_note?: string | null;
        receipt_id?: string | null;
      })
    | null;
};

type ReportDataset = {
  profile: ProfileSummary | null;
  propertyName: string | null;
  incomes: IncomeEntryRow[];
  expenses: (ExpenseEntryRow & {
    tax_amount?: number | null;
    allocation_note?: string | null;
    receipt_id?: string | null;
  })[];
  receipts: ReportReceiptRow[];
};

type GeneratedArtifact = {
  buffer: Buffer;
  fileName: string;
  mimeType: string;
};

type StorageReceiptFile = {
  path: string;
  fileName: string;
  monthFolder: string;
  content: Buffer;
};

const REPORT_BUCKET = "generated-reports";
const RECEIPT_BUCKET = "receipt-originals";

function escapeCsvCell(value: unknown) {
  if (value === null || value === undefined) return "";

  const stringValue = String(value);

  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

function toCsv(headers: string[], rows: Array<Record<string, unknown>>) {
  const lines = [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => escapeCsvCell(row[header])).join(","))
  ];

  return Buffer.from(lines.join("\n"), "utf8");
}

function sanitizeFileNamePart(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function safeFileName(base: string, extension: string) {
  const normalized = sanitizeFileNamePart(base) || "report";
  return `${normalized}.${extension}`;
}

function formatMoney(amount: number | null | undefined, currency = "EUR") {
  const numericValue = Number(amount ?? 0);

  return new Intl.NumberFormat("en-FI", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(numericValue);
}

function formatDateRange(dateFrom: string, dateTo: string) {
  return dateFrom === dateTo ? dateFrom : `${dateFrom} to ${dateTo}`;
}

function getMonthFolder(dateLike: string | null | undefined) {
  const value = dateLike?.slice(0, 7);
  return value && /^\d{4}-\d{2}$/.test(value) ? value : "unknown-month";
}

function pdfEscape(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function buildSimplePdf(title: string, lines: string[]) {
  const objects: string[] = [];
  const addObject = (content: string) => {
    objects.push(content);
    return objects.length;
  };

  const pageHeight = 842;
  const top = 792;
  const leading = 16;
  const pageLineCapacity = 42;
  const lineChunks: string[][] = [];

  for (let index = 0; index < lines.length; index += pageLineCapacity) {
    lineChunks.push(lines.slice(index, index + pageLineCapacity));
  }

  const fontObjectId = addObject(
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"
  );
  const pageIds: number[] = [];

  const contentIds = lineChunks.map((chunk, pageIndex) => {
    const textLines = [
      "BT",
      `/F1 ${pageIndex === 0 ? 16 : 12} Tf`,
      `1 0 0 1 56 ${top} Tm`,
      `(${pdfEscape(pageIndex === 0 ? title : `${title} (cont.)`)}) Tj`
    ];

    chunk.forEach((line, lineIndex) => {
      const y = top - (lineIndex + 2) * leading;
      textLines.push(`1 0 0 1 56 ${y} Tm`);
      textLines.push(`(${pdfEscape(line)}) Tj`);
    });
    textLines.push("ET");

    const stream = textLines.join("\n");

    return addObject(
      `<< /Length ${Buffer.byteLength(stream, "utf8")} >>\nstream\n${stream}\nendstream`
    );
  });

  const pagesObjectId = objects.length + lineChunks.length + 1;

  contentIds.forEach((contentId) => {
    const pageId = addObject(
      `<< /Type /Page /Parent ${pagesObjectId} 0 R /MediaBox [0 0 595 ${pageHeight}] /Resources << /Font << /F1 ${fontObjectId} 0 R >> >> /Contents ${contentId} 0 R >>`
    );
    pageIds.push(pageId);
  });

  addObject(
    `<< /Type /Pages /Count ${pageIds.length} /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] >>`
  );
  const catalogObjectId = addObject(`<< /Type /Catalog /Pages ${pagesObjectId} 0 R >>`);

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [0];

  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(pdf, "utf8"));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefOffset = Buffer.byteLength(pdf, "utf8");
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogObjectId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return Buffer.from(pdf, "utf8");
}

function crc32(buffer: Buffer) {
  let crc = 0 ^ -1;

  for (let i = 0; i < buffer.length; i += 1) {
    crc ^= buffer[i];

    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }

  return (crc ^ -1) >>> 0;
}

function dosDateTime(date = new Date()) {
  const year = Math.max(1980, date.getFullYear());
  const dosTime =
    (date.getHours() << 11) |
    (date.getMinutes() << 5) |
    (Math.floor(date.getSeconds() / 2) & 0x1f);
  const dosDate = ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();

  return { dosDate, dosTime };
}

function buildZip(entries: Array<{ name: string; content: Buffer }>) {
  const localParts: Buffer[] = [];
  const centralParts: Buffer[] = [];
  let offset = 0;

  entries.forEach((entry) => {
    const nameBuffer = Buffer.from(entry.name.replace(/\\/g, "/"), "utf8");
    const content = entry.content;
    const crc = crc32(content);
    const { dosDate, dosTime } = dosDateTime();

    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0, 6);
    localHeader.writeUInt16LE(0, 8);
    localHeader.writeUInt16LE(dosTime, 10);
    localHeader.writeUInt16LE(dosDate, 12);
    localHeader.writeUInt32LE(crc, 14);
    localHeader.writeUInt32LE(content.length, 18);
    localHeader.writeUInt32LE(content.length, 22);
    localHeader.writeUInt16LE(nameBuffer.length, 26);
    localHeader.writeUInt16LE(0, 28);
    localParts.push(localHeader, nameBuffer, content);

    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(20, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(0, 8);
    centralHeader.writeUInt16LE(0, 10);
    centralHeader.writeUInt16LE(dosTime, 12);
    centralHeader.writeUInt16LE(dosDate, 14);
    centralHeader.writeUInt32LE(crc, 16);
    centralHeader.writeUInt32LE(content.length, 20);
    centralHeader.writeUInt32LE(content.length, 24);
    centralHeader.writeUInt16LE(nameBuffer.length, 28);
    centralHeader.writeUInt16LE(0, 30);
    centralHeader.writeUInt16LE(0, 32);
    centralHeader.writeUInt16LE(0, 34);
    centralHeader.writeUInt16LE(0, 36);
    centralHeader.writeUInt32LE(0, 38);
    centralHeader.writeUInt32LE(offset, 42);
    centralParts.push(centralHeader, nameBuffer);

    offset += localHeader.length + nameBuffer.length + content.length;
  });

  const centralDirectory = Buffer.concat(centralParts);
  const endRecord = Buffer.alloc(22);
  endRecord.writeUInt32LE(0x06054b50, 0);
  endRecord.writeUInt16LE(0, 4);
  endRecord.writeUInt16LE(0, 6);
  endRecord.writeUInt16LE(entries.length, 8);
  endRecord.writeUInt16LE(entries.length, 10);
  endRecord.writeUInt32LE(centralDirectory.length, 12);
  endRecord.writeUInt32LE(offset, 16);
  endRecord.writeUInt16LE(0, 20);

  return Buffer.concat([...localParts, centralDirectory, endRecord]);
}

function buildIncomeCsv(incomes: IncomeEntryRow[]) {
  return toCsv(
    [
      "income_id",
      "date",
      "property",
      "platform",
      "gross_amount",
      "platform_fee",
      "cleaning_fee",
      "net_payout",
      "currency",
      "notes"
    ],
    incomes.map((entry) => ({
      income_id: entry.id,
      date: entry.date,
      property: entry.properties?.name ?? "",
      platform: entry.platform,
      gross_amount: entry.gross_amount,
      platform_fee: entry.platform_fee,
      cleaning_fee: entry.cleaning_fee,
      net_payout: entry.net_payout,
      currency: entry.currency,
      notes: entry.notes ?? ""
    }))
  );
}

function buildExpenseCsv(
  expenses: Array<
    ExpenseEntryRow & {
      tax_amount?: number | null;
      allocation_note?: string | null;
      receipt_id?: string | null;
    }
  >,
  receiptsByExpenseId: Map<string, ReportReceiptRow>
) {
  return toCsv(
    [
      "expense_id",
      "date",
      "property",
      "vendor",
      "category",
      "total_amount",
      "tax_amount",
      "currency",
      "allocation_method",
      "allocation_percentage",
      "candidate_reportable_amount",
      "notes",
      "receipt_file",
      "status"
    ],
    expenses.map((entry) => ({
      expense_id: entry.id,
      date: entry.date ?? "",
      property: entry.properties?.name ?? "",
      vendor: entry.vendor ?? "",
      category: entry.categories?.name ?? "",
      total_amount: entry.total_amount,
      tax_amount: entry.tax_amount ?? "",
      currency: entry.currency,
      allocation_method: entry.allocation_method,
      allocation_percentage: entry.allocation_percentage,
      candidate_reportable_amount: entry.candidate_reportable_amount,
      notes: entry.notes ?? "",
      receipt_file:
        receiptsByExpenseId.get(entry.id)?.source_documents?.original_file_name ??
        receiptsByExpenseId.get(entry.id)?.original_file_path ??
        "",
      status: entry.status
    }))
  );
}

function buildAllocationCsv(
  expenses: Array<
    ExpenseEntryRow & {
      allocation_note?: string | null;
    }
  >
) {
  return toCsv(
    [
      "expense_id",
      "date",
      "property",
      "vendor",
      "category",
      "total_amount",
      "allocation_method",
      "allocation_percentage",
      "candidate_reportable_amount",
      "allocation_note"
    ],
    expenses.map((entry) => ({
      expense_id: entry.id,
      date: entry.date ?? "",
      property: entry.properties?.name ?? "",
      vendor: entry.vendor ?? "",
      category: entry.categories?.name ?? "",
      total_amount: entry.total_amount,
      allocation_method: entry.allocation_method,
      allocation_percentage: entry.allocation_percentage,
      candidate_reportable_amount: entry.candidate_reportable_amount,
      allocation_note: entry.allocation_note ?? ""
    }))
  );
}

function buildSummaryPdf(
  dataset: ReportDataset,
  filters: ReportFilters,
  yearLabel: string
) {
  const currency =
    dataset.profile?.default_currency ??
    dataset.expenses[0]?.currency ??
    dataset.incomes[0]?.currency ??
    "EUR";
  const incomeTotal = dataset.incomes.reduce(
    (sum, entry) => sum + Number(entry.net_payout ?? entry.gross_amount ?? 0),
    0
  );
  const expenseTotal = dataset.expenses.reduce(
    (sum, entry) => sum + Number(entry.total_amount ?? 0),
    0
  );
  const candidateTotal = dataset.expenses.reduce(
    (sum, entry) => sum + Number(entry.candidate_reportable_amount ?? 0),
    0
  );
  const receiptCount = dataset.receipts.length;
  const categoryBreakdown = new Map<string, number>();

  dataset.expenses.forEach((expense) => {
    const key = expense.categories?.name ?? "Uncategorized";
    categoryBreakdown.set(
      key,
      (categoryBreakdown.get(key) ?? 0) + Number(expense.total_amount ?? 0)
    );
  });

  const lines = [
    `Prepared for: ${dataset.profile?.company_name ?? dataset.profile?.full_name ?? "Account owner"}`,
    `Date range: ${formatDateRange(filters.dateFrom, filters.dateTo)}`,
    `Property filter: ${dataset.propertyName ?? "All properties"}`,
    `Income summary: ${formatMoney(incomeTotal, currency)}`,
    `Expense summary: ${formatMoney(expenseTotal, currency)}`,
    `Candidate reportable amount summary: ${formatMoney(candidateTotal, currency)}`,
    `Estimated rental result: ${formatMoney(incomeTotal - candidateTotal, currency)}`,
    `Receipt summary: ${receiptCount} receipt file(s) included in reporting preparation.`,
    "",
    "Category breakdown:"
  ];

  Array.from(categoryBreakdown.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .forEach(([name, total]) => {
      lines.push(`- ${name}: ${formatMoney(total, currency)}`);
    });

  lines.push("", "Disclaimer:", DISCLAIMER_TEXT);

  return {
    buffer: buildSimplePdf(`Tax-preparation report ${yearLabel}`, lines),
    fileName: safeFileName(`tax-preparation-report-${yearLabel}`, "pdf"),
    mimeType: "application/pdf"
  };
}

async function loadReceiptFiles(receipts: ReportReceiptRow[]) {
  const supabase = await createServerClient();
  const files: StorageReceiptFile[] = [];

  for (const receipt of receipts) {
    const filePath =
      receipt.source_documents?.original_file_path ?? receipt.original_file_path ?? null;

    if (!filePath) continue;

    const download = await supabase.storage.from(RECEIPT_BUCKET).download(filePath);

    if (download.error || !download.data) {
      continue;
    }

    const fileName =
      receipt.source_documents?.original_file_name ??
      filePath.split("/").pop() ??
      `${receipt.id}.bin`;

    files.push({
      path: filePath,
      fileName,
      monthFolder: getMonthFolder(
        receipt.expense_entries?.date ??
          receipt.source_documents?.created_at?.slice(0, 10) ??
          receipt.created_at.slice(0, 10)
      ),
      content: Buffer.from(await download.data.arrayBuffer())
    });
  }

  return files;
}

async function buildReceiptArchiveZip(
  receipts: ReportReceiptRow[],
  yearLabel: string
): Promise<GeneratedArtifact> {
  const files = await loadReceiptFiles(receipts);
  const root = `airbnb-receipts-${yearLabel}`;
  const entries = files.map((file) => ({
    name: `${root}/receipts/${file.monthFolder}/${safeFileName(file.fileName.replace(/\.[^.]+$/, ""), file.fileName.split(".").pop() ?? "bin")}`,
    content: file.content
  }));

  return {
    buffer: buildZip(entries),
    fileName: safeFileName(`receipt-archive-${yearLabel}`, "zip"),
    mimeType: "application/zip"
  };
}

async function buildFullReportingZip(
  dataset: ReportDataset,
  filters: ReportFilters,
  yearLabel: string
): Promise<GeneratedArtifact> {
  const summaryPdf = buildSummaryPdf(dataset, filters, yearLabel);
  const incomeCsv = buildIncomeCsv(dataset.incomes);
  const receiptsByExpenseId = new Map<string, ReportReceiptRow>();
  dataset.receipts.forEach((receipt) => {
    if (receipt.expense_entry_id) {
      receiptsByExpenseId.set(receipt.expense_entry_id, receipt);
    }
  });
  const expenseCsv = buildExpenseCsv(dataset.expenses, receiptsByExpenseId);
  const allocationCsv = buildAllocationCsv(dataset.expenses);
  const receiptFiles = await loadReceiptFiles(dataset.receipts);
  const root = `airbnb-reporting-${yearLabel}`;
  const entries = [
    { name: `${root}/summary_${yearLabel}.pdf`, content: summaryPdf.buffer },
    { name: `${root}/income_${yearLabel}.csv`, content: incomeCsv },
    { name: `${root}/expenses_${yearLabel}.csv`, content: expenseCsv },
    { name: `${root}/allocations_${yearLabel}.csv`, content: allocationCsv },
    ...receiptFiles.map((file) => ({
      name: `${root}/receipts/${file.monthFolder}/${safeFileName(file.fileName.replace(/\.[^.]+$/, ""), file.fileName.split(".").pop() ?? "bin")}`,
      content: file.content
    }))
  ];

  return {
    buffer: buildZip(entries),
    fileName: safeFileName(`full-reporting-${yearLabel}`, "zip"),
    mimeType: "application/zip"
  };
}

export async function getReportDataset(userId: string, filters: ReportFilters) {
  const supabase = await createServerClient();
  const propertyId = filters.propertyId;
  const categoryId = filters.categoryId;
  const profileQuery = supabase
    .from("profiles")
    .select("full_name,company_name,country,default_currency,disclaimer_accepted_at")
    .eq("id", userId)
    .single();

  let incomeQuery = supabase
    .from("income_entries")
    .select("*, properties(name)")
    .eq("user_id", userId)
    .gte("date", filters.dateFrom)
    .lte("date", filters.dateTo)
    .order("date", { ascending: true });

  let expenseQuery = supabase
    .from("expense_entries")
    .select("*, properties(name), categories(name)")
    .eq("user_id", userId)
    .gte("date", filters.dateFrom)
    .lte("date", filters.dateTo)
    .order("date", { ascending: true, nullsFirst: false });

  const receiptQuery = supabase
    .from("receipts")
    .select(
      "*, source_documents(id,property_id,original_file_path,original_file_name,mime_type,created_at,properties(name)), expense_entries!receipts_expense_entry_id_fkey(*, properties(name), categories(name))"
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (propertyId) {
    incomeQuery = incomeQuery.eq("property_id", propertyId);
    expenseQuery = expenseQuery.eq("property_id", propertyId);
  }

  if (categoryId) {
    expenseQuery = expenseQuery.eq("category_id", categoryId);
  }

  const [profileResult, incomeResult, expenseResult, receiptResult, propertyResult] =
    await Promise.all([
      profileQuery,
      incomeQuery,
      expenseQuery,
      receiptQuery,
      propertyId
        ? supabase
            .from("properties")
            .select("name")
            .eq("id", propertyId)
            .eq("user_id", userId)
            .single()
        : Promise.resolve({ data: null, error: null })
    ]);

  if (profileResult.error) throw profileResult.error;
  if (incomeResult.error) throw incomeResult.error;
  if (expenseResult.error) throw expenseResult.error;
  if (receiptResult.error) throw receiptResult.error;
  if (propertyResult && "error" in propertyResult && propertyResult.error) {
    throw propertyResult.error;
  }

  const expenses = ((expenseResult.data ?? []) as ReportDataset["expenses"]).filter(
    (entry) => entry.status !== "archived"
  );
  const expenseIdSet = new Set(expenses.map((expense) => expense.id));
  const receipts = ((receiptResult.data ?? []) as ReportReceiptRow[]).filter(
    (receipt) => {
      if (receipt.status === "archived") return false;

      const linkedExpense = receipt.expense_entries;

      if (linkedExpense) {
        if (!expenseIdSet.has(linkedExpense.id)) return false;
        if (categoryId && linkedExpense.category_id !== categoryId) return false;
        return true;
      }

      const fallbackDate =
        receipt.source_documents?.created_at?.slice(0, 10) ??
        receipt.created_at.slice(0, 10);
      const inRange = fallbackDate >= filters.dateFrom && fallbackDate <= filters.dateTo;
      const propertyMatches = propertyId
        ? receipt.source_documents?.property_id === propertyId
        : true;

      return inRange && propertyMatches && !categoryId;
    }
  );

  return {
    profile: (profileResult.data as ProfileSummary | null) ?? null,
    propertyName:
      propertyResult && "data" in propertyResult
        ? ((propertyResult.data as { name?: string } | null)?.name ?? null)
        : null,
    incomes: (incomeResult.data ?? []) as IncomeEntryRow[],
    expenses,
    receipts
  } satisfies ReportDataset;
}

export async function generateReportArtifact(
  type: ReportType,
  dataset: ReportDataset,
  filters: ReportFilters
): Promise<GeneratedArtifact> {
  const yearLabel = filters.dateFrom.slice(0, 4);
  const receiptsByExpenseId = new Map<string, ReportReceiptRow>();
  dataset.receipts.forEach((receipt) => {
    if (receipt.expense_entry_id) {
      receiptsByExpenseId.set(receipt.expense_entry_id, receipt);
    }
  });

  switch (type) {
    case "income_csv":
      return {
        buffer: buildIncomeCsv(dataset.incomes),
        fileName: safeFileName(`income-${yearLabel}`, "csv"),
        mimeType: "text/csv; charset=utf-8"
      };
    case "expense_csv":
      return {
        buffer: buildExpenseCsv(dataset.expenses, receiptsByExpenseId),
        fileName: safeFileName(`expenses-${yearLabel}`, "csv"),
        mimeType: "text/csv; charset=utf-8"
      };
    case "allocation_csv":
      return {
        buffer: buildAllocationCsv(dataset.expenses),
        fileName: safeFileName(`allocations-${yearLabel}`, "csv"),
        mimeType: "text/csv; charset=utf-8"
      };
    case "tax_preparation_pdf":
      return buildSummaryPdf(dataset, filters, yearLabel);
    case "receipt_archive_zip":
      return buildReceiptArchiveZip(dataset.receipts, yearLabel);
    case "full_reporting_zip":
      return buildFullReportingZip(dataset, filters, yearLabel);
    default:
      throw new Error("Unsupported report type.");
  }
}

export async function uploadGeneratedReport(args: {
  userId: string;
  reportId: string;
  artifact: GeneratedArtifact;
}) {
  const supabase = await createServerClient();
  const filePath = `${args.userId}/${args.reportId}/${args.artifact.fileName}`;
  const upload = await supabase.storage
    .from(REPORT_BUCKET)
    .upload(filePath, args.artifact.buffer, {
      upsert: true,
      contentType: args.artifact.mimeType
    });

  if (upload.error) throw upload.error;

  return {
    filePath,
    fileName: args.artifact.fileName,
    mimeType: args.artifact.mimeType,
    fileSizeBytes: args.artifact.buffer.byteLength
  };
}

export async function createReportDownloadUrl(report: ReportRow) {
  if (!report.file_path) return null;

  const supabase = await createServerClient();
  const signed = await supabase.storage
    .from(REPORT_BUCKET)
    .createSignedUrl(report.file_path, 60 * 10);

  if (signed.error || !signed.data?.signedUrl) {
    throw signed.error ?? new Error("Could not create signed report download URL.");
  }

  return signed.data.signedUrl;
}

export { REPORT_BUCKET, safeFileName };
