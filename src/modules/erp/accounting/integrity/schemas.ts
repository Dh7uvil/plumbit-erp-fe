import { z } from "zod";

export const GlIntegrityIssueSchema = z.object({
  kind: z.enum(["unbalanced_journal", "trial_balance", "control_vs_subledger"]),
  message: z.string(),
  journal_id: z.string().uuid().nullable().optional(),
  document_number: z.string().nullable().optional(),
  debit: z.string().nullable().optional(),
  credit: z.string().nullable().optional(),
  party_type: z.string().nullable().optional(),
  party_id: z.string().uuid().nullable().optional(),
  party_name: z.string().nullable().optional(),
  gl_balance: z.string().nullable().optional(),
  subledger_balance: z.string().nullable().optional(),
  variance: z.string().nullable().optional(),
});

export const GlIntegrityResponseSchema = z.object({
  as_of: z.string(),
  ok: z.boolean(),
  issue_count: z.number(),
  issues: z.array(GlIntegrityIssueSchema),
});

export type GlIntegrityIssue = z.infer<typeof GlIntegrityIssueSchema>;
export type GlIntegrityResponse = z.infer<typeof GlIntegrityResponseSchema>;
