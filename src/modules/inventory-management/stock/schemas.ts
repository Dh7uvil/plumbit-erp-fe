import { z } from "zod";

import { DecimalStringSchema, NullableDecimalStringSchema } from "@/shared/lib/money";

export const STOCK_MOVEMENT_TYPES = [
  "PURCHASE",
  "SALE",
  "IMPORT",
  "EXPORT",
  "TRANSFER_IN",
  "TRANSFER_OUT",
  "RETURN_IN",
  "RETURN_OUT",
  "ADJUSTMENT",
  "DAMAGE",
  "OPENING_STOCK",
  "QC_HOLD",
  "QC_RELEASE",
] as const;
export const StockMovementTypeSchema = z.enum(STOCK_MOVEMENT_TYPES);
export type StockMovementType = z.infer<typeof StockMovementTypeSchema>;

export const STOCK_MOVEMENT_TYPE_LABELS: Record<StockMovementType, string> = {
  PURCHASE: "Purchase",
  SALE: "Sale",
  IMPORT: "Import",
  EXPORT: "Export",
  TRANSFER_IN: "Transfer in",
  TRANSFER_OUT: "Transfer out",
  RETURN_IN: "Return in",
  RETURN_OUT: "Return out",
  ADJUSTMENT: "Adjustment",
  DAMAGE: "Damage",
  OPENING_STOCK: "Opening stock",
  QC_HOLD: "QC hold",
  QC_RELEASE: "QC release",
};

export const StockBalanceSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  warehouse_id: z.string().uuid(),
  warehouse_code: z.string(),
  warehouse_name: z.string(),
  product_id: z.string().uuid(),
  sku: z.string(),
  product_name: z.string(),
  qty_on_hand: DecimalStringSchema,
  qty_reserved: DecimalStringSchema,
  qty_quality_hold: DecimalStringSchema,
  qty_available: DecimalStringSchema,
  qty_incoming: DecimalStringSchema,
  qty_outgoing: DecimalStringSchema,
  qty_in_transit: DecimalStringSchema,
  reorder_level: NullableDecimalStringSchema,
  reorder_qty: NullableDecimalStringSchema,
  last_movement_at: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
  unit_cost: DecimalStringSchema.optional(),
  stock_value: DecimalStringSchema.optional(),
});
export type StockBalance = z.infer<typeof StockBalanceSchema>;

export const StockBalanceListSchema = z.array(StockBalanceSchema);

export const StockMovementSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  movement_type: StockMovementTypeSchema,
  warehouse_id: z.string().uuid(),
  warehouse_code: z.string(),
  warehouse_name: z.string(),
  product_id: z.string().uuid(),
  sku: z.string(),
  product_name: z.string(),
  unit_id: z.string().uuid().nullable(),
  qty: DecimalStringSchema,
  qty_before: DecimalStringSchema,
  qty_after: DecimalStringSchema,
  source_type: z.string(),
  source_id: z.string().uuid(),
  source_line_id: z.string().uuid().nullable(),
  document_date: z.string(),
  occurred_at: z.string(),
  notes: z.string().nullable(),
  created_at: z.string(),
  unit_cost: DecimalStringSchema.optional(),
  value: DecimalStringSchema.optional(),
  is_estimated_cost: z.boolean().optional(),
});
export type StockMovement = z.infer<typeof StockMovementSchema>;

export const StockCostLayerSchema = z.object({
  id: z.string().uuid(),
  warehouse_id: z.string().uuid(),
  product_id: z.string().uuid(),
  source_type: z.string(),
  source_id: z.string().uuid(),
  source_line_id: z.string().uuid().nullable(),
  document_date: z.string(),
  qty_received: DecimalStringSchema,
  qty_remaining: DecimalStringSchema,
  unit_cost: DecimalStringSchema,
  landed_unit_cost: DecimalStringSchema,
  is_estimated: z.boolean(),
  is_negative: z.boolean(),
  created_at: z.string(),
});
export type StockCostLayer = z.infer<typeof StockCostLayerSchema>;

export const StockCostLayerListSchema = z.array(StockCostLayerSchema);

export const StockMovementListSchema = z.array(StockMovementSchema);

export const StockReorderUpdateSchema = z.object({
  reorder_level: NullableDecimalStringSchema.optional(),
  reorder_qty: NullableDecimalStringSchema.optional(),
});
export type StockReorderUpdate = z.infer<typeof StockReorderUpdateSchema>;

export const StockReorderFormSchema = z.object({
  reorder_level: z.string(),
  reorder_qty: z.string(),
});
export type StockReorderFormValues = z.infer<typeof StockReorderFormSchema>;

export type StockListParams = {
  page?: number;
  page_size?: number;
  search?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
  warehouse_id?: string;
  product_id?: string;
  category_id?: string;
  negative_only?: boolean;
  below_reorder?: boolean;
};

export type StockMovementListParams = {
  page?: number;
  page_size?: number;
  search?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
  warehouse_id?: string;
  product_id?: string;
  category_id?: string;
  movement_type?: StockMovementType;
  source_type?: string;
  source_id?: string;
  document_date_from?: string;
  document_date_to?: string;
};

export const STOCK_MOVEMENT_SOURCE_TYPES = [
  "stock_adjustment",
  "stock_transfer",
  "goods_receipt",
  "quality_inspection",
] as const;
export type StockMovementSourceType = (typeof STOCK_MOVEMENT_SOURCE_TYPES)[number];

export const STOCK_MOVEMENT_SOURCE_TYPE_LABELS: Record<StockMovementSourceType, string> = {
  stock_adjustment: "Stock adjustment",
  stock_transfer: "Stock transfer",
  goods_receipt: "Goods receipt",
  quality_inspection: "Quality inspection",
};

export function parseStockMovementType(value: string | undefined): StockMovementType | undefined {
  return STOCK_MOVEMENT_TYPES.includes(value as StockMovementType)
    ? (value as StockMovementType)
    : undefined;
}

export function parseStockMovementSourceType(
  value: string | undefined,
): StockMovementSourceType | undefined {
  return STOCK_MOVEMENT_SOURCE_TYPES.includes(value as StockMovementSourceType)
    ? (value as StockMovementSourceType)
    : undefined;
}

export function stockMovementSourceLabel(sourceType: string): string {
  return STOCK_MOVEMENT_SOURCE_TYPE_LABELS[sourceType as StockMovementSourceType] ?? sourceType;
}

export function stockMovementSourceHref(sourceType: string, sourceId: string): string | null {
  if (sourceType === "stock_adjustment") {
    return `/stock-adjustments/${sourceId}`;
  }
  if (sourceType === "stock_transfer") {
    return `/stock-transfers/${sourceId}`;
  }
  if (sourceType === "goods_receipt") {
    return `/goods-receipts/${sourceId}`;
  }
  if (sourceType === "quality_inspection") {
    return `/quality-inspections/${sourceId}`;
  }
  return null;
}

const ZERO_QTY = /^[-+]?0+(?:\.0+)?$/;

export function qtyIsNegative(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.startsWith("-") && !ZERO_QTY.test(trimmed);
}

export function qtyIsBelowReorder(available: string, reorder: string | null): boolean {
  if (reorder == null || reorder === "") {
    return false;
  }
  const qty = Number(available);
  const level = Number(reorder);
  if (!Number.isFinite(qty) || !Number.isFinite(level)) {
    return false;
  }
  return qty < level;
}
