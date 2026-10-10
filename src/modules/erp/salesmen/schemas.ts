import { z } from "zod";

import { MoneySchema } from "@/shared/lib/money";

export const SalesmanPeriodAmountSchema = z.object({
  period: z.number().int().min(1).max(12),
  target: MoneySchema,
  actual: MoneySchema,
});

export const SalesmanOverviewRowSchema = z.object({
  employee_id: z.string().uuid(),
  employee_code: z.string(),
  name: z.string(),
  designation: z.string().nullable().optional().default(null),
  fiscal_year: z.number().int(),
  periods: z.array(SalesmanPeriodAmountSchema),
  target_total: MoneySchema,
  actual_total: MoneySchema,
});
export type SalesmanOverviewRow = z.infer<typeof SalesmanOverviewRowSchema>;

export const SalesmanOverviewListSchema = z.array(SalesmanOverviewRowSchema);

export const SalesmanTargetsUpdateSchema = z.object({
  fiscal_year: z.number().int(),
  periods: z.array(
    z.object({
      period: z.number().int().min(1).max(12),
      target: MoneySchema,
    }),
  ),
});
