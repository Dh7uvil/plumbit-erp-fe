import { z } from "zod";

export const BankAccountSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  account_id: z.string().uuid(),
  account_name: z.string(),
  bank_name: z.string(),
  branch_name: z.string().nullable(),
  account_number: z.string().nullable(),
  iban: z.string().nullable(),
  swift: z.string().nullable(),
  currency_id: z.string().uuid(),
  opening_balance: z.string(),
  opening_date: z.string().nullable(),
  is_default: z.boolean(),
  is_active: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
  created_by: z.string().uuid().nullable().optional(),
  updated_by: z.string().uuid().nullable().optional(),
});

export const BankAccountListSchema = z.array(BankAccountSchema);

export const BankAccountCreateRequestSchema = z.object({
  account_id: z.string().uuid(),
  account_name: z.string().min(1),
  bank_name: z.string().min(1),
  branch_name: z.string().nullable().optional(),
  account_number: z.string().nullable().optional(),
  iban: z.string().nullable().optional(),
  swift: z.string().nullable().optional(),
  currency_id: z.string().uuid(),
  opening_balance: z.string().optional(),
  opening_date: z.string().nullable().optional(),
  is_default: z.boolean().optional(),
});

export const BankAccountUpdateRequestSchema = BankAccountCreateRequestSchema.partial().extend({
  is_active: z.boolean().optional(),
});

export type BankAccount = z.infer<typeof BankAccountSchema>;
export type BankAccountCreateRequest = z.infer<typeof BankAccountCreateRequestSchema>;
export type BankAccountUpdateRequest = z.infer<typeof BankAccountUpdateRequestSchema>;
export type BankAccountListParams = {
  page?: number;
  page_size?: number;
  search?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
  is_active?: boolean;
  currency_id?: string;
};
