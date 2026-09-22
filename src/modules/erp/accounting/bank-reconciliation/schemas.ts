import { z } from "zod";

export const BankStatementLineSchema = z.object({
  id: z.string().uuid(),
  line_number: z.number(),
  line_date: z.string(),
  description: z.string().nullable(),
  reference: z.string().nullable(),
  debit: z.string(),
  credit: z.string(),
  match_status: z.enum(["UNMATCHED", "MATCHED", "EXCLUDED"]),
  matched_journal_line_id: z.string().uuid().nullable(),
});

export const BankStatementSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  bank_account_id: z.string().uuid(),
  period_start: z.string(),
  period_end: z.string(),
  opening_balance: z.string(),
  closing_balance: z.string(),
  status: z.enum(["DRAFT", "IMPORTED", "RECONCILED"]),
  import_reference: z.string().nullable(),
  notes: z.string().nullable(),
  version: z.number(),
  lines: z.array(BankStatementLineSchema).default([]),
  created_at: z.string(),
  updated_at: z.string(),
});

export const BookEntryCandidateSchema = z.object({
  journal_line_id: z.string().uuid(),
  journal_entry_id: z.string().uuid(),
  entry_date: z.string(),
  document_number: z.string().nullable(),
  narration: z.string().nullable(),
  reference: z.string().nullable(),
  debit: z.string(),
  credit: z.string(),
  is_matched: z.boolean(),
});

export const MatchSuggestionSchema = z.object({
  statement_line_id: z.string().uuid(),
  journal_line_id: z.string().uuid(),
  score: z.number(),
  reason: z.string(),
});

export const ReconciliationStatementSchema = z.object({
  bank_account_id: z.string().uuid(),
  period_start: z.string(),
  period_end: z.string(),
  book_balance: z.string(),
  statement_balance: z.string(),
  unmatched_statement_total: z.string(),
  unmatched_book_total: z.string(),
  reconciled_balance: z.string(),
  currency_id: z.string().uuid(),
});

export type BankStatement = z.infer<typeof BankStatementSchema>;
export type BookEntryCandidate = z.infer<typeof BookEntryCandidateSchema>;
export type MatchSuggestion = z.infer<typeof MatchSuggestionSchema>;
export type ReconciliationStatement = z.infer<typeof ReconciliationStatementSchema>;

export type BankStatementListParams = {
  page?: number;
  page_size?: number;
  search?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
  bank_account_id?: string;
  status?: string;
};
