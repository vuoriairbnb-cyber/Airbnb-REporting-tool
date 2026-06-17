import { z } from "zod";

export const allocationMethodSchema = z.enum([
  "full_rental_use",
  "manual_percentage",
  "excluded"
]);

export const expenseInputSchema = z.object({
  property_id: z.string().uuid().nullable(),
  date: z.string().nullable(),
  vendor: z.string().min(1).nullable(),
  category_id: z.string().uuid().nullable(),
  total_amount: z.number().nonnegative(),
  currency: z.string().min(3).max(3),
  allocation_method: allocationMethodSchema,
  allocation_percentage: z.number().min(0).max(100),
  allocation_note: z.string().max(500).nullable()
});
