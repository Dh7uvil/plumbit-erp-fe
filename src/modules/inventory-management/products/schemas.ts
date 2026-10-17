import { z } from "zod";

import { MoneySchema } from "@/shared/lib/money";

export const ITEM_TYPES = ["PRODUCT", "SERVICE"] as const;
export const ItemTypeSchema = z.enum(ITEM_TYPES);
export type ItemType = z.infer<typeof ItemTypeSchema>;

export const ITEM_TYPE_LABELS: Record<ItemType, string> = {
  PRODUCT: "Product",
  SERVICE: "Service",
};

export const ProductSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  item_type: ItemTypeSchema,
  sku: z.string(),
  name: z.string(),
  sales_description: z.string().nullable(),
  unit_id: z.string().uuid().nullable(),
  pieces_per_unit: z.string().nullable().optional().default(null),
  category_id: z.string().uuid().nullable(),
  selling_rate: MoneySchema,
  purchase_rate: MoneySchema,
  price_1: MoneySchema.optional().default("0"),
  price_2: MoneySchema.optional().default("0"),
  brand: z.string().nullable().optional().default(null),
  origin_country_code: z.string().nullable().optional().default(null),
  engine: z.string().nullable().optional().default(null),
  alias_2: z.string().nullable().optional().default(null),
  alias_3: z.string().nullable().optional().default(null),
  alias_4: z.string().nullable().optional().default(null),
  stock_input_disabled: z.boolean().optional().default(false),
  secondary_unit_id: z.string().uuid().nullable().optional().default(null),
  secondary_unit_factor: z.string().nullable().optional().default(null),
  purchase_description: z.string().nullable(),
  tax_id: z.string().uuid().nullable(),
  income_account_id: z.string().uuid().nullable().optional().default(null),
  purchase_account_id: z.string().uuid().nullable().optional().default(null),
  hs_code: z.string().nullable(),
  volume: z.string().nullable().optional().default(null),
  track_inventory: z.boolean(),
  requires_qc: z.boolean(),
  is_active: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
  created_by: z.string().uuid().nullable().optional().default(null),
  updated_by: z.string().uuid().nullable().optional().default(null),
});
export type Product = z.infer<typeof ProductSchema>;

export const ProductListSchema = z.array(ProductSchema);

export const ProductCreateRequestSchema = z.object({
  sku: z.string().min(1).max(80),
  name: z.string().min(1).max(200),
  item_type: ItemTypeSchema.optional(),
  sales_description: z.string().nullable().optional(),
  unit_id: z.string().uuid().nullable().optional(),
  pieces_per_unit: z.string().nullable().optional(),
  category_id: z.string().uuid().nullable().optional(),
  selling_rate: MoneySchema.optional(),
  purchase_rate: MoneySchema.optional(),
  purchase_description: z.string().nullable().optional(),
  tax_id: z.string().uuid().nullable().optional(),
  income_account_id: z.string().uuid().nullable().optional(),
  purchase_account_id: z.string().uuid().nullable().optional(),
  hs_code: z.string().max(20).nullable().optional(),
  volume: z.string().nullable().optional(),
  track_inventory: z.boolean().optional(),
  requires_qc: z.boolean().nullable().optional(),
});
export type ProductCreateRequest = z.infer<typeof ProductCreateRequestSchema>;

export const ProductUpdateRequestSchema = z.object({
  item_type: ItemTypeSchema.nullable().optional(),
  name: z.string().min(1).max(200).nullable().optional(),
  sales_description: z.string().nullable().optional(),
  unit_id: z.string().uuid().nullable().optional(),
  pieces_per_unit: z.string().nullable().optional(),
  category_id: z.string().uuid().nullable().optional(),
  selling_rate: MoneySchema.nullable().optional(),
  purchase_rate: MoneySchema.nullable().optional(),
  purchase_description: z.string().nullable().optional(),
  tax_id: z.string().uuid().nullable().optional(),
  income_account_id: z.string().uuid().nullable().optional(),
  purchase_account_id: z.string().uuid().nullable().optional(),
  hs_code: z.string().max(20).nullable().optional(),
  volume: z.string().nullable().optional(),
  track_inventory: z.boolean().nullable().optional(),
  requires_qc: z.boolean().nullable().optional(),
  is_active: z.boolean().nullable().optional(),
});
export type ProductUpdateRequest = z.infer<typeof ProductUpdateRequestSchema>;

export const ProductFormSchema = z.object({
  sku: z.string().min(1, "Enter a SKU").max(80),
  name: z.string().min(1, "Enter a name").max(200),
  item_type: ItemTypeSchema,
  sales_description: z.string(),
  unit_id: z.string(),
  pieces_per_unit: z
    .string()
    .refine((value) => {
      const trimmed = value.trim();
      if (!trimmed) {
        return true;
      }
      const n = Number(trimmed);
      return Number.isFinite(n) && n > 0;
    }, "Enter a quantity greater than 0"),
  category_id: z.string(),
  selling_rate: z.string(),
  purchase_rate: z.string(),
  purchase_description: z.string(),
  tax_id: z.string(),
  income_account_id: z.string(),
  purchase_account_id: z.string(),
  hs_code: z.string().max(20),
  volume: z.string(),
  track_inventory: z.boolean(),
  requires_qc: z.boolean(),
  is_active: z.boolean(),
});
export type ProductFormValues = z.infer<typeof ProductFormSchema>;

/** Read-only label such as "10 ( pieces ) / Box" from pieces per unit and unit name. */
export function formatPacking(
  piecesPerUnit: string | null | undefined,
  unitName: string | null | undefined,
): string | null {
  const qtyRaw = piecesPerUnit?.trim();
  const unit = unitName?.trim();
  if (!qtyRaw || !unit) {
    return null;
  }
  const n = Number(qtyRaw);
  if (!Number.isFinite(n) || n <= 0) {
    return null;
  }
  const qty = qtyRaw.includes(".")
    ? qtyRaw.replace(/(\.\d*?[1-9])0+$/, "$1").replace(/\.0+$/, "").replace(/\.$/, "")
    : qtyRaw;
  return `${qty} ( pieces ) / ${unit}`;
}

export type ProductListParams = {
  page?: number;
  page_size?: number;
  search?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
  item_type?: ItemType;
  category_id?: string;
  unit_id?: string;
  tax_id?: string;
  is_active?: boolean;
};

export const ProductWarehouseQtySchema = z.object({
  warehouse_id: z.string().uuid(),
  warehouse_name: z.string(),
  qty_on_hand: z.string(),
  qty_reserved: z.string(),
  qty_available: z.string(),
});
export type ProductWarehouseQty = z.infer<typeof ProductWarehouseQtySchema>;

export const ProductInquirySchema = z.object({
  product_id: z.string().uuid(),
  packing_label: z.string().nullable(),
  qty_on_hand: z.string(),
  qty_reserved: z.string(),
  qty_available: z.string(),
  qty_incoming: z.string(),
  unit2_breakdown: z.string().nullable(),
  warehouses: z.array(ProductWarehouseQtySchema),
  avg_cost: z.string().nullable(),
  lc_price: z.string().nullable(),
  lc_currency_code: z.string().nullable(),
  last_sale_date: z.string().nullable(),
  last_sale_price: z.string().nullable(),
  last_sale_quantity: z.string().nullable(),
  last_purchase_date: z.string().nullable(),
  last_purchase_price: z.string().nullable(),
  last_purchase_quantity: z.string().nullable(),
});
export type ProductInquiry = z.infer<typeof ProductInquirySchema>;
