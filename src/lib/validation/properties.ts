import { z } from "zod";

export const propertyInputSchema = z.object({
  name: z.string().min(1),
  address: z.string().nullable(),
  city: z.string().nullable(),
  country: z.string().min(2),
  currency: z.string().min(3).max(3),
  default_allocation_method: z.string().nullable(),
  default_allocation_percentage: z.number().min(0).max(100).nullable(),
  is_active: z.boolean()
});
