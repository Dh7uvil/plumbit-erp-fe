import { z } from "zod";

import {
  BillingStatusSchema,
  PurchaseOrderStatusSchema,
} from "@/modules/erp/purchase-orders/schemas";
import { DecimalStringSchema } from "@/shared/lib/money";

export const PURCHASE_WORKSPACE_TABS = ["orders", "bills", "to-receive", "to-bill"] as const;
export type PurchaseWorkspaceTab = (typeof PURCHASE_WORKSPACE_TABS)[number];

export function parsePurchaseWorkspaceTab(value: string | null): PurchaseWorkspaceTab {
  return PURCHASE_WORKSPACE_TABS.includes(value as PurchaseWorkspaceTab)
    ? (value as PurchaseWorkspaceTab)
    : "orders";
}

export const OutstandingBillLineSchema = z.object({
  line_id: z.string().uuid(),
  line_number: z.number().int(),
  description: z.string(),
  quantity: DecimalStringSchema,
  qty_fulfilled: DecimalStringSchema,
  qty_remaining: DecimalStringSchema,
});
export type OutstandingBillLine = z.infer<typeof OutstandingBillLineSchema>;

export const PurchaseOrderBillingQueueItemSchema = z.object({
  id: z.string().uuid(),
  document_number: z.string(),
  supplier_id: z.string().uuid(),
  order_date: z.string(),
  status: PurchaseOrderStatusSchema,
  billing_status: BillingStatusSchema,
  currency_id: z.string().uuid(),
  lines: z.array(OutstandingBillLineSchema).default([]),
});
export type PurchaseOrderBillingQueueItem = z.infer<typeof PurchaseOrderBillingQueueItemSchema>;
export const PurchaseOrderBillingQueueListSchema = z.array(PurchaseOrderBillingQueueItemSchema);

export const GoodsReceiptBillingQueueItemSchema = z.object({
  id: z.string().uuid(),
  document_number: z.string(),
  supplier_id: z.string().uuid(),
  purchase_order_id: z.string().uuid().nullable(),
  document_date: z.string(),
  status: z.string(),
  currency_id: z.string().uuid().nullable(),
  lines: z.array(OutstandingBillLineSchema).default([]),
});
export type GoodsReceiptBillingQueueItem = z.infer<typeof GoodsReceiptBillingQueueItemSchema>;
export const GoodsReceiptBillingQueueListSchema = z.array(GoodsReceiptBillingQueueItemSchema);

export type BillingQueueListParams = {
  page?: number;
  page_size?: number;
};
