import { z } from "zod";

export const incomeInputSchema = z.object({
  property_id: z.string().uuid().nullable(),
  date: z.string(),
  platform: z.string().min(1),
  gross_amount: z.number().nonnegative().nullable(),
  platform_fee: z.number().nonnegative().nullable(),
  cleaning_fee: z.number().nonnegative().nullable(),
  net_payout: z.number().nonnegative().nullable(),
  currency: z.string().min(3).max(3),
  notes: z.string().max(1000).nullable()
});
