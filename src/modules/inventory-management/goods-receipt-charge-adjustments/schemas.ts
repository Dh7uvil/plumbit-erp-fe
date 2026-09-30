import { z } from "zod";

import {
  STOCK_DOCUMENT_STATUS_LABELS,
  STOCK_DOCUMENT_STATUS_VARIANTS,
  STOCK_DOCUMENT_STATUSES,
  StockDocumentStatusSchema,
  type StockDocumentStatus,
} from "@/modules/inventory-management/stock-adjustments/schemas";
import { MoneySchema } from "@/shared/lib/money";

export {
  STOCK_DOCUMENT_STATUS_LABELS,
  STOCK_DOCUMENT_STATUS_VARIANTS,
  STOCK_DOCUMENT_STATUSES,
  StockDocumentStatusSchema,
};
export type { StockDocumentStatus };

export const GrnChargeAdjustmentLineSchema = z.object({
  id: z.string().uuid(),
  line_number: z.number().int(),
  goods_receipt_charge_id: z.string().uuid(),
  adjustment_amount: MoneySchema,
  base_adjustment_amount: MoneySchema,
  notes: z.string().nullable().optional().default(null),
});
export type GrnChargeAdjustmentLine = z.infer<typeof GrnChargeAdjustmentLineSchema>;

export const GrnChargeAdjustmentSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  document_number: z.string(),
  status: StockDocumentStatusSchema,
  version: z.number().int(),
  is_posted: z.boolean(),
  document_date: z.string(),
  goods_receipt_id: z.string().uuid(),
  branch_id: z.string().uuid().nullable(),
  notes: z.string().nullable(),
  posted_at: z.string().nullable(),
  posted_by: z.string().uuid().nullable(),
  cancelled_at: z.string().nullable(),
  cancelled_by: z.string().uuid().nullable(),
  cancel_reason: z.string().nullable(),
  available_actions: z.array(z.string()).default([]),
  period_locked: z.boolean().default(false),
  lines: z.array(GrnChargeAdjustmentLineSchema).optional().default([]),
  created_at: z.string(),
  updated_at: z.string(),
  created_by: z.string().uuid().nullable().optional().default(null),
  updated_by: z.string().uuid().nullable().optional().default(null),
});
export type GrnChargeAdjustment = z.infer<typeof GrnChargeAdjustmentSchema>;

export const GrnChargeAdjustmentListSchema = z.array(GrnChargeAdjustmentSchema);

export const GrnChargeAdjustmentLineInputSchema = z.object({
  goods_receipt_charge_id: z.string().uuid(),
  adjustment_amount: MoneySchema,
  notes: z.string().nullable().optional(),
});
export type GrnChargeAdjustmentLineInput = z.infer<typeof GrnChargeAdjustmentLineInputSchema>;

export const GrnChargeAdjustmentCreateRequestSchema = z.object({
  goods_receipt_id: z.string().uuid(),
  document_date: z.string().nullable().optional(),
  branch_id: z.string().uuid().nullable().optional(),
  notes: z.string().nullable().optional(),
  lines: z.array(GrnChargeAdjustmentLineInputSchema).min(1),
});
export type GrnChargeAdjustmentCreateRequest = z.infer<
  typeof GrnChargeAdjustmentCreateRequestSchema
>;

export const GrnChargeAdjustmentUpdateRequestSchema = z.object({
  document_date: z.string().nullable().optional(),
  branch_id: z.string().uuid().nullable().optional(),
  notes: z.string().nullable().optional(),
  lines: z.array(GrnChargeAdjustmentLineInputSchema).min(1).nullable().optional(),
  version: z.number().int().optional(),
});
export type GrnChargeAdjustmentUpdateRequest = z.infer<
  typeof GrnChargeAdjustmentUpdateRequestSchema
>;

export type GrnChargeAdjustmentListParams = {
  page?: number;
  page_size?: number;
  search?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
  status?: StockDocumentStatus;
  goods_receipt_id?: string;
  branch_id?: string;
  document_date_from?: string;
  document_date_to?: string;
};

export function grnChargeAdjustmentDisplayNumber(
  document: Pick<GrnChargeAdjustment, "document_number">,
): string | null {
  const value = document.document_number.trim();
  return value ? value : null;
}
