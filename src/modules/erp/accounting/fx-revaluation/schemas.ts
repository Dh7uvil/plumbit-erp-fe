import { z } from "zod";

import { DecimalStringSchema } from "@/shared/lib/money";

export const FxExposureLineSchema = z.object({
  exposure_kind: z.string(),
  currency_id: z.string().uuid(),
  currency_code: z.string().nullable().optional().default(null),
  party_id: z.string().uuid().nullable().optional().default(null),
  account_id: z.string().uuid(),
  foreign_balance: DecimalStringSchema,
  closing_rate: DecimalStringSchema,
  book_base: DecimalStringSchema,
  revalued_base: DecimalStringSchema,
  gain_base: DecimalStringSchema,
  source_id: z.string().uuid().nullable().optional().default(null),
});

export const FxExposureSchema = z.object({
  as_of: z.string(),
  currency_code: z.string().nullable().optional().default(null),
  total_gain_base: DecimalStringSchema,
  lines: z.array(FxExposureLineSchema).optional().default([]),
  warnings: z.array(z.string()).optional().default([]),
});
export type FxExposure = z.infer<typeof FxExposureSchema>;

export const FxRevaluationRunSchema = z.object({
  id: z.string().uuid(),
  as_of_date: z.string(),
  status: z.string(),
  version: z.number(),
  journal_entry_id: z.string().uuid().nullable().optional().default(null),
  reversal_journal_entry_id: z.string().uuid().nullable().optional().default(null),
  total_gain_base: DecimalStringSchema,
  warnings: z.array(z.string()).optional().default([]),
  lines: z
    .array(
      z.object({
        id: z.string().uuid(),
        exposure_kind: z.string(),
        currency_code: z.string().nullable().optional().default(null),
        foreign_balance: DecimalStringSchema,
        gain_base: DecimalStringSchema,
        account_id: z.string().uuid(),
      }),
    )
    .optional()
    .default([]),
  available_actions: z.array(z.string()).optional().default([]),
});
export type FxRevaluationRun = z.infer<typeof FxRevaluationRunSchema>;
export const FxRevaluationRunListSchema = z.array(FxRevaluationRunSchema);
