import { z } from "zod";

import { DecimalStringSchema } from "@/shared/lib/money";

export const PeriodLockSchema = z.object({
  lock_date: z.string().nullable(),
  hard_lock_date: z.string().nullable(),
  lock_reason: z.string().nullable(),
  hard_lock_reason: z.string().nullable(),
});
export type PeriodLock = z.infer<typeof PeriodLockSchema>;

export const PeriodLockUpdateSchema = z.object({
  lock_date: z.string().nullable().optional(),
  hard_lock_date: z.string().nullable().optional(),
  reason: z.string().max(500).nullable().optional(),
  acknowledge_negative_stock: z.boolean().optional(),
});
export type PeriodLockUpdate = z.infer<typeof PeriodLockUpdateSchema>;

export const PeriodLockNegativeBalanceSchema = z.object({
  warehouse_id: z.string().uuid(),
  warehouse_code: z.string(),
  product_id: z.string().uuid(),
  sku: z.string(),
  qty_on_hand: DecimalStringSchema,
});
export type PeriodLockNegativeBalance = z.infer<typeof PeriodLockNegativeBalanceSchema>;

export const PERIOD_LOCK_UNPOSTED_TYPES = ["stock_adjustment", "stock_transfer"] as const;
export const PeriodLockUnpostedDocumentTypeSchema = z.enum(PERIOD_LOCK_UNPOSTED_TYPES);
export type PeriodLockUnpostedDocumentType = z.infer<typeof PeriodLockUnpostedDocumentTypeSchema>;

export const PeriodLockUnpostedDocumentSchema = z.object({
  id: z.string().uuid(),
  document_type: PeriodLockUnpostedDocumentTypeSchema,
  document_number: z.string(),
  document_date: z.string(),
  status: z.string(),
});
export type PeriodLockUnpostedDocument = z.infer<typeof PeriodLockUnpostedDocumentSchema>;

export const PeriodLockPreviewSchema = z.object({
  allow_negative_stock: z.boolean(),
  negative_balances: z.array(PeriodLockNegativeBalanceSchema),
  negative_balances_total_count: z.number().int(),
  negative_balances_are_current: z.boolean().default(true),
  unposted_documents: z.array(PeriodLockUnpostedDocumentSchema),
  unposted_documents_total_count: z.number().int(),
  blocked: z.boolean(),
  requires_acknowledgement: z.boolean(),
});
export type PeriodLockPreview = z.infer<typeof PeriodLockPreviewSchema>;

export type PeriodLockPreviewParams = {
  lock_date?: string | null;
  hard_lock_date?: string | null;
};

export function periodLockUnpostedHref(document: PeriodLockUnpostedDocument): string {
  if (document.document_type === "stock_transfer") {
    return `/stock-transfers/${document.id}`;
  }
  return `/stock-adjustments/${document.id}`;
}

export function periodLockUnpostedLabel(document: PeriodLockUnpostedDocument): string {
  const kind = document.document_type === "stock_transfer" ? "Transfer" : "Adjustment";
  const number = document.document_number.trim() || document.id;
  return `${kind} ${number}`;
}
