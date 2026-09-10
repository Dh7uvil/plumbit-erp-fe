import { z } from "zod";

import { OPTIONAL_SELECT_NONE } from "@/config/constants";
import { DecimalStringSchema } from "@/shared/lib/money";

export const JOURNAL_STATUSES = ["DRAFT", "POSTED", "CANCELLED"] as const;
export const JournalStatusSchema = z.enum(JOURNAL_STATUSES);
export type JournalStatus = z.infer<typeof JournalStatusSchema>;

export const JOURNAL_STATUS_LABELS: Record<JournalStatus, string> = {
  DRAFT: "Draft",
  POSTED: "Posted",
  CANCELLED: "Cancelled",
};

export const JOURNAL_STATUS_VARIANTS: Record<
  JournalStatus,
  "muted" | "success" | "destructive"
> = {
  DRAFT: "muted",
  POSTED: "success",
  CANCELLED: "destructive",
};

export const JOURNAL_TYPES = ["MANUAL", "OPENING_BALANCE", "SYSTEM", "REVERSAL"] as const;
export const JournalTypeSchema = z.enum(JOURNAL_TYPES);
export type JournalType = z.infer<typeof JournalTypeSchema>;

export const JOURNAL_TYPE_LABELS: Record<JournalType, string> = {
  MANUAL: "Manual",
  OPENING_BALANCE: "Opening balance",
  SYSTEM: "System",
  REVERSAL: "Reversal",
};

export const PARTY_TYPES = ["CUSTOMER", "SUPPLIER"] as const;
export const PartyTypeSchema = z.enum(PARTY_TYPES);
export type PartyType = z.infer<typeof PartyTypeSchema>;

export const JournalLineSchema = z.object({
  id: z.string().uuid(),
  line_number: z.number().int(),
  account_id: z.string().uuid(),
  debit: DecimalStringSchema,
  credit: DecimalStringSchema,
  debit_base: DecimalStringSchema,
  credit_base: DecimalStringSchema,
  currency_id: z.string().uuid(),
  exchange_rate: DecimalStringSchema,
  party_type: PartyTypeSchema.nullable(),
  party_id: z.string().uuid().nullable(),
  due_date: z.string().nullable(),
  external_reference: z.string().nullable(),
  tax_id: z.string().uuid().nullable(),
  branch_id: z.string().uuid().nullable(),
  description: z.string().nullable(),
});
export type JournalLine = z.infer<typeof JournalLineSchema>;

export const JournalEntrySchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  document_number: z.string(),
  entry_date: z.string(),
  status: JournalStatusSchema,
  version: z.number().int(),
  is_posted: z.boolean(),
  journal_type: JournalTypeSchema,
  source_type: z.string().nullable(),
  source_id: z.string().uuid().nullable(),
  reversal_of_id: z.string().uuid().nullable(),
  reversed_by_id: z.string().uuid().nullable(),
  currency_id: z.string().uuid(),
  exchange_rate: DecimalStringSchema,
  branch_id: z.string().uuid().nullable(),
  narration: z.string().nullable(),
  reference: z.string().nullable(),
  posted_at: z.string().nullable(),
  posted_by: z.string().uuid().nullable(),
  total_debit_base: DecimalStringSchema,
  total_credit_base: DecimalStringSchema,
  available_actions: z.array(z.string()).default([]),
  period_locked: z.boolean().default(false),
  lines: z.array(JournalLineSchema).optional().default([]),
  created_at: z.string(),
  updated_at: z.string(),
});
export type JournalEntry = z.infer<typeof JournalEntrySchema>;
export const JournalEntryListSchema = z.array(JournalEntrySchema);

export const JournalLineInputSchema = z.object({
  account_id: z.string().uuid(),
  debit: DecimalStringSchema,
  credit: DecimalStringSchema,
  currency_id: z.string().uuid().nullable().optional(),
  exchange_rate: DecimalStringSchema.nullable().optional(),
  party_type: PartyTypeSchema.nullable().optional(),
  party_id: z.string().uuid().nullable().optional(),
  due_date: z.string().nullable().optional(),
  external_reference: z.string().nullable().optional(),
  tax_id: z.string().uuid().nullable().optional(),
  branch_id: z.string().uuid().nullable().optional(),
  description: z.string().nullable().optional(),
});
export type JournalLineInput = z.infer<typeof JournalLineInputSchema>;

export const JournalEntryCreateRequestSchema = z.object({
  entry_date: z.string().nullable().optional(),
  currency_id: z.string().uuid().nullable().optional(),
  exchange_rate: DecimalStringSchema.nullable().optional(),
  branch_id: z.string().uuid().nullable().optional(),
  narration: z.string().nullable().optional(),
  reference: z.string().max(100).nullable().optional(),
  lines: z.array(JournalLineInputSchema).min(1),
});
export type JournalEntryCreateRequest = z.infer<typeof JournalEntryCreateRequestSchema>;

export const JournalEntryUpdateRequestSchema = JournalEntryCreateRequestSchema.extend({
  version: z.number().int().min(1).optional(),
  lines: z.array(JournalLineInputSchema).min(1).optional(),
});
export type JournalEntryUpdateRequest = z.infer<typeof JournalEntryUpdateRequestSchema>;

export const JournalLineFormSchema = z.object({
  account_id: z.string(),
  debit: z.string(),
  credit: z.string(),
  party_type: z.string(),
  party_id: z.string(),
  due_date: z.string(),
  external_reference: z.string(),
  description: z.string(),
});
export type JournalLineFormValues = z.infer<typeof JournalLineFormSchema>;

export const JournalFormSchema = z
  .object({
    entry_date: z.string().min(1, "Enter a date"),
    currency_id: z.string().uuid("Select a currency"),
    exchange_rate: z.string().min(1, "Enter a rate"),
    branch_id: z.string(),
    narration: z.string(),
    reference: z.string().max(100),
    lines: z.array(JournalLineFormSchema).min(2, "Add at least two lines"),
  })
  .superRefine((values, ctx) => {
    const filled = values.lines.filter((line) => !isBlankJournalLine(line));
    if (filled.length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Add at least two lines",
        path: ["lines"],
      });
    }
    filled.forEach((line, index) => {
      if (line.account_id === OPTIONAL_SELECT_NONE) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Select an account",
          path: ["lines", index, "account_id"],
        });
      }
    });
  });
export type JournalFormValues = z.infer<typeof JournalFormSchema>;

export function emptyJournalLine(): JournalLineFormValues {
  return {
    account_id: OPTIONAL_SELECT_NONE,
    debit: "",
    credit: "",
    party_type: OPTIONAL_SELECT_NONE,
    party_id: OPTIONAL_SELECT_NONE,
    due_date: "",
    external_reference: "",
    description: "",
  };
}

export function isBlankJournalLine(line: JournalLineFormValues): boolean {
  return (
    (!line.account_id || line.account_id === OPTIONAL_SELECT_NONE) &&
    !line.debit.trim() &&
    !line.credit.trim() &&
    !line.description.trim() &&
    !line.external_reference.trim()
  );
}

export function journalDisplayNumber(entry: Pick<JournalEntry, "document_number">): string | null {
  return entry.document_number || null;
}

export type JournalListParams = {
  page?: number;
  page_size?: number;
  search?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
  status?: JournalStatus;
  journal_type?: JournalType;
  account_id?: string;
  party_id?: string;
  branch_id?: string;
  entry_date_from?: string;
  entry_date_to?: string;
};
