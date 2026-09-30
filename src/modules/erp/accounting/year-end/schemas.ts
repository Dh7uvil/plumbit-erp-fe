import { z } from "zod";

import { DecimalStringSchema } from "@/shared/lib/money";

export const YearEndPreviewLineSchema = z.object({
  account_id: z.string().uuid(),
  account_code: z.string(),
  account_name: z.string(),
  account_type: z.string(),
  debit: DecimalStringSchema,
  credit: DecimalStringSchema,
  closing_debit: DecimalStringSchema,
  closing_credit: DecimalStringSchema,
});
export type YearEndPreviewLine = z.infer<typeof YearEndPreviewLineSchema>;

export const YearEndPreviewSchema = z.object({
  fiscal_year: z.number().int(),
  from_date: z.string(),
  to_date: z.string(),
  entry_date: z.string(),
  retained_earnings_account_id: z.string().uuid(),
  net_profit: DecimalStringSchema,
  total_debit: DecimalStringSchema,
  total_credit: DecimalStringSchema,
  lines: z.array(YearEndPreviewLineSchema).default([]),
});
export type YearEndPreview = z.infer<typeof YearEndPreviewSchema>;

export const YearEndStateSchema = z.object({
  fiscal_year: z.number().int(),
  from_date: z.string(),
  to_date: z.string(),
  is_closed: z.boolean(),
  journal_entry_id: z.string().uuid().nullable().optional(),
  document_number: z.string().nullable().optional(),
  committed_at: z.string().nullable().optional(),
  lock_date: z.string().nullable().optional(),
});
export type YearEndState = z.infer<typeof YearEndStateSchema>;

export const YearEndCommitRequestSchema = z.object({
  fiscal_year: z.number().int().min(1900).max(9999),
});
export type YearEndCommitRequest = z.infer<typeof YearEndCommitRequestSchema>;
