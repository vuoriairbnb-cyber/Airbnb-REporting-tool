import { z } from "zod";

export const reportCreateSchema = z.object({
  type: z.enum([
    "income_csv",
    "expense_csv",
    "allocation_csv",
    "tax_preparation_pdf",
    "receipt_archive_zip",
    "full_reporting_zip"
  ]),
  property_id: z.string().uuid().nullable(),
  date_from: z.string(),
  date_to: z.string()
});
