import { z } from "zod";

const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD date format.");

export const reportTypeSchema = z.enum([
  "income_csv",
  "expense_csv",
  "allocation_csv",
  "tax_preparation_pdf",
  "receipt_archive_zip",
  "full_reporting_zip"
]);

const nullableUuid = z.string().uuid().nullable().optional();

export const createReportSchema = z
  .object({
    type: reportTypeSchema,
    property_id: nullableUuid,
    category_id: nullableUuid,
    date_from: isoDateSchema,
    date_to: isoDateSchema
  })
  .superRefine((value, ctx) => {
    if (value.date_from > value.date_to) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["date_to"],
        message: "Date to must be on or after date from."
      });
    }
  });

export type CreateReportInput = z.infer<typeof createReportSchema>;
