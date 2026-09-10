import { z } from "zod";

import { OPTIONAL_SELECT_NONE } from "@/config/constants";
import { DecimalStringSchema } from "@/shared/lib/money";

export const OpeningBalanceGLLineSchema = z.object({
  account_id: z.string().uuid(),
  debit: DecimalStringSchema,
  credit: DecimalStringSchema,
  description: z.string().nullable().optional(),
});

export const OpeningBalanceOpenItemSchema = z.object({
  party_id: z.string().uuid(),
  amount: DecimalStringSchema,
  due_date: z.string(),
  external_reference: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
});

export const OpeningBalanceStockLineSchema = z.object({
  warehouse_id: z.string().uuid(),
  product_id: z.string().uuid(),
  quantity: DecimalStringSchema,
  unit_cost: DecimalStringSchema,
});

export const OpeningBalancePayloadSchema = z.object({
  books_start_date: z.string().min(1),
  gl_lines: z.array(OpeningBalanceGLLineSchema).default([]),
  ar_items: z.array(OpeningBalanceOpenItemSchema).default([]),
  ap_items: z.array(OpeningBalanceOpenItemSchema).default([]),
  stock_lines: z.array(OpeningBalanceStockLineSchema).default([]),
});
export type OpeningBalancePayload = z.infer<typeof OpeningBalancePayloadSchema>;

export const OpeningBalancePreviewLineSchema = z.object({
  account_id: z.string().uuid(),
  account_code: z.string(),
  account_name: z.string(),
  debit: DecimalStringSchema,
  credit: DecimalStringSchema,
  party_id: z.string().uuid().nullable().optional(),
  due_date: z.string().nullable().optional(),
  external_reference: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
});

export const OpeningBalancePreviewSchema = z.object({
  books_start_date: z.string(),
  entry_date: z.string(),
  opening_balance_equity_account_id: z.string().uuid(),
  difference: DecimalStringSchema,
  total_debit: DecimalStringSchema,
  total_credit: DecimalStringSchema,
  inventory_value: DecimalStringSchema,
  lines: z.array(OpeningBalancePreviewLineSchema),
});
export type OpeningBalancePreview = z.infer<typeof OpeningBalancePreviewSchema>;

export const OpeningBalanceStateSchema = z.object({
  committed: z.boolean(),
  books_start_date: z.string().nullable(),
  hard_lock_date: z.string().nullable(),
  journal_entry_id: z.string().uuid().nullable().optional(),
  document_number: z.string().nullable().optional(),
  committed_at: z.string().nullable().optional(),
  can_reset: z.boolean().default(false),
});
export type OpeningBalanceState = z.infer<typeof OpeningBalanceStateSchema>;

export const OpeningBalanceGLFormLineSchema = z.object({
  account_id: z.string(),
  debit: z.string(),
  credit: z.string(),
  description: z.string(),
});

export const OpeningBalanceItemFormSchema = z.object({
  party_id: z.string(),
  amount: z.string(),
  due_date: z.string(),
  external_reference: z.string(),
  description: z.string(),
});

export const OpeningBalanceStockFormLineSchema = z.object({
  warehouse_id: z.string(),
  product_id: z.string(),
  quantity: z.string(),
  unit_cost: z.string(),
});

export const OpeningBalanceFormSchema = z.object({
  books_start_date: z.string().min(1, "Enter the books start date"),
  gl_lines: z.array(OpeningBalanceGLFormLineSchema),
  ar_items: z.array(OpeningBalanceItemFormSchema),
  ap_items: z.array(OpeningBalanceItemFormSchema),
  stock_lines: z.array(OpeningBalanceStockFormLineSchema),
});
export type OpeningBalanceFormValues = z.infer<typeof OpeningBalanceFormSchema>;

export const OPENING_BALANCE_STEPS = [
  { id: "dates", label: "Books start" },
  { id: "gl", label: "GL balances" },
  { id: "ar", label: "Open AR" },
  { id: "ap", label: "Open AP" },
  { id: "stock", label: "Opening stock" },
  { id: "preview", label: "Preview" },
  { id: "commit", label: "Commit" },
] as const;

export function emptyGlLine() {
  return { account_id: OPTIONAL_SELECT_NONE, debit: "", credit: "", description: "" };
}

export function emptyOpenItem() {
  return {
    party_id: OPTIONAL_SELECT_NONE,
    amount: "",
    due_date: "",
    external_reference: "",
    description: "",
  };
}

export function emptyStockLine() {
  return {
    warehouse_id: OPTIONAL_SELECT_NONE,
    product_id: OPTIONAL_SELECT_NONE,
    quantity: "",
    unit_cost: "",
  };
}
