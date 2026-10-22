import { z } from "zod";

import { DecimalStringSchema, MoneySchema, NullableDecimalStringSchema } from "@/shared/lib/money";

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
  rem: z.string().nullable().optional().default(null),
  remarks: z.string().nullable().optional().default(null),
  max_level: z.string().nullable().optional().default(null),
  default_reorder_level: z.string().nullable().optional().default(null),
  net_weight: z.string().nullable().optional().default(null),
  gross_weight: z.string().nullable().optional().default(null),
  track_inventory: z.boolean(),
  requires_qc: z.boolean(),
  is_active: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
  created_by: z.string().uuid().nullable().optional().default(null),
  updated_by: z.string().uuid().nullable().optional().default(null),
  qty_on_hand: MoneySchema.nullable().optional(),
  qty_opened: MoneySchema.nullable().optional(),
  qty_committed: MoneySchema.nullable().optional(),
  net_available: MoneySchema.nullable().optional(),
  shop_qty: MoneySchema.nullable().optional(),
  warehouse_qty: MoneySchema.nullable().optional(),
  ordered_qty: MoneySchema.nullable().optional(),
  last_sale_date: z.string().nullable().optional(),
  last_sale_price: MoneySchema.nullable().optional(),
  last_purchase_date: z.string().nullable().optional(),
  last_purchase_price: MoneySchema.nullable().optional(),
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
  brand: z.string().max(120).nullable().optional(),
  origin_country_code: z.string().max(2).nullable().optional(),
  engine: z.string().max(80).nullable().optional(),
  alias_2: z.string().max(80).nullable().optional(),
  alias_3: z.string().max(80).nullable().optional(),
  alias_4: z.string().max(80).nullable().optional(),
  rem: z.string().max(200).nullable().optional(),
  remarks: z.string().nullable().optional(),
  max_level: z.string().nullable().optional(),
  default_reorder_level: z.string().nullable().optional(),
  net_weight: z.string().nullable().optional(),
  gross_weight: z.string().nullable().optional(),
  price_1: MoneySchema.optional(),
  price_2: MoneySchema.optional(),
  stock_input_disabled: z.boolean().optional(),
  secondary_unit_id: z.string().uuid().nullable().optional(),
  secondary_unit_factor: z.string().nullable().optional(),
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
  brand: z.string().max(120).nullable().optional(),
  origin_country_code: z.string().max(2).nullable().optional(),
  engine: z.string().max(80).nullable().optional(),
  alias_2: z.string().max(80).nullable().optional(),
  alias_3: z.string().max(80).nullable().optional(),
  alias_4: z.string().max(80).nullable().optional(),
  rem: z.string().max(200).nullable().optional(),
  remarks: z.string().nullable().optional(),
  max_level: z.string().nullable().optional(),
  default_reorder_level: z.string().nullable().optional(),
  net_weight: z.string().nullable().optional(),
  gross_weight: z.string().nullable().optional(),
  price_1: MoneySchema.nullable().optional(),
  price_2: MoneySchema.nullable().optional(),
  stock_input_disabled: z.boolean().nullable().optional(),
  secondary_unit_id: z.string().uuid().nullable().optional(),
  secondary_unit_factor: z.string().nullable().optional(),
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
  pieces_per_unit: z.string().refine((value) => {
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
  brand: z.string().max(120),
  origin_country_code: z.string().max(2),
  engine: z.string().max(80),
  alias_2: z.string().max(80),
  alias_3: z.string().max(80),
  alias_4: z.string().max(80),
  rem: z.string().max(200),
  remarks: z.string(),
  max_level: z.string(),
  default_reorder_level: z.string(),
  net_weight: z.string(),
  gross_weight: z.string(),
  price_1: z.string(),
  price_2: z.string(),
  stock_input_disabled: z.boolean(),
  secondary_unit_id: z.string(),
  secondary_unit_factor: z.string(),
  track_inventory: z.boolean(),
  requires_qc: z.boolean(),
  is_active: z.boolean(),
});
export type ProductFormValues = z.infer<typeof ProductFormSchema>;

export const PRODUCT_FORM_UPDATE_KEYS = [
  "item_type",
  "name",
  "sales_description",
  "unit_id",
  "pieces_per_unit",
  "category_id",
  "selling_rate",
  "purchase_rate",
  "purchase_description",
  "tax_id",
  "income_account_id",
  "purchase_account_id",
  "hs_code",
  "volume",
  "brand",
  "origin_country_code",
  "engine",
  "alias_2",
  "alias_3",
  "alias_4",
  "rem",
  "remarks",
  "max_level",
  "default_reorder_level",
  "net_weight",
  "gross_weight",
  "price_1",
  "price_2",
  "stock_input_disabled",
  "secondary_unit_id",
  "secondary_unit_factor",
  "track_inventory",
  "requires_qc",
  "is_active",
] as const satisfies readonly (keyof ProductFormValues)[];

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
    ? qtyRaw
        .replace(/(\.\d*?[1-9])0+$/, "$1")
        .replace(/\.0+$/, "")
        .replace(/\.$/, "")
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

export const ProductQuantityUnitBreakdownSchema = z.object({
  unit_qty: z.string(),
  unit2_qty: z.string(),
  remainder_qty: z.string(),
});
export type ProductQuantityUnitBreakdown = z.infer<typeof ProductQuantityUnitBreakdownSchema>;

export const ProductInquiryQuantityRowsSchema = z.object({
  on_hand: ProductQuantityUnitBreakdownSchema.nullable().optional().default(null),
  opened: ProductQuantityUnitBreakdownSchema.nullable().optional().default(null),
  committed: ProductQuantityUnitBreakdownSchema.nullable().optional().default(null),
  net_available: ProductQuantityUnitBreakdownSchema.nullable().optional().default(null),
});
export type ProductInquiryQuantityRows = z.infer<typeof ProductInquiryQuantityRowsSchema>;

export const ProductInquirySchema = z.object({
  product_id: z.string().uuid(),
  packing_label: z.string().nullable(),
  qty_on_hand: z.string(),
  qty_reserved: z.string(),
  qty_available: z.string(),
  qty_incoming: z.string(),
  qty_opened: z.string().optional().default("0"),
  qty_committed: z.string().optional().default("0"),
  net_available: z.string().optional().default("0"),
  ordered_qty: z.string().optional().default("0"),
  shop_qty: z.string().optional().default("0"),
  warehouse_qty: z.string().optional().default("0"),
  unit2_breakdown: z.string().nullable(),
  quantity_rows: ProductInquiryQuantityRowsSchema.nullable().optional().default(null),
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
  sku: z.string().nullable().optional().default(null),
  name: z.string().nullable().optional().default(null),
  alias_2: z.string().nullable().optional().default(null),
  alias_3: z.string().nullable().optional().default(null),
  alias_4: z.string().nullable().optional().default(null),
  volume: z.string().nullable().optional().default(null),
  brand: z.string().nullable().optional().default(null),
  origin_country_code: z.string().nullable().optional().default(null),
  engine: z.string().nullable().optional().default(null),
  category_name: z.string().nullable().optional().default(null),
  tax_name: z.string().nullable().optional().default(null),
  tax_rate: z.string().nullable().optional().default(null),
  selling_rate: z.string().nullable().optional().default(null),
  price_1: z.string().nullable().optional().default(null),
  price_2: z.string().nullable().optional().default(null),
  purchase_rate: z.string().nullable().optional().default(null),
  net_weight: z.string().nullable().optional().default(null),
  gross_weight: z.string().nullable().optional().default(null),
  rem: z.string().nullable().optional().default(null),
  remarks: z.string().nullable().optional().default(null),
  unit_code: z.string().nullable().optional().default(null),
  unit2_code: z.string().nullable().optional().default(null),
});
export type ProductInquiry = z.infer<typeof ProductInquirySchema>;

export const INVENTORY_LIST_SEARCH_TYPES = ["default", "starts_with"] as const;
export const InventoryListSearchTypeSchema = z.enum(INVENTORY_LIST_SEARCH_TYPES);
export type InventoryListSearchType = z.infer<typeof InventoryListSearchTypeSchema>;

export const ProductInventoryListRowSchema = z.object({
  product_id: z.string().uuid(),
  sku: z.string(),
  name: z.string(),
  net_quantity: z.string(),
  net_available: z.string(),
  volume: z.string().nullable().optional().default(null),
  alias_2: z.string().nullable().optional().default(null),
  alias_3: z.string().nullable().optional().default(null),
  alias_4: z.string().nullable().optional().default(null),
  brand: z.string().nullable().optional().default(null),
  engine: z.string().nullable().optional().default(null),
  packing_label: z.string().nullable().optional().default(null),
  selling_rate: z.string().nullable().optional().default(null),
  price_1: z.string().nullable().optional().default(null),
  price_2: z.string().nullable().optional().default(null),
  purchase_rate: z.string().nullable().optional().default(null),
  lc_price: z.string().nullable().optional().default(null),
  avg_cost: z.string().nullable().optional().default(null),
  last_purchase_price: z.string().nullable().optional().default(null),
  ordered_qty: z.string().optional().default("0"),
  shop_qty: z.string().optional().default("0"),
  warehouse_qty: z.string().optional().default("0"),
  qty_on_hand: z.string().optional().default("0"),
  qty_opened: z.string().optional().default("0"),
  qty_committed: z.string().optional().default("0"),
});
export type ProductInventoryListRow = z.infer<typeof ProductInventoryListRowSchema>;
export const ProductInventoryListSchema = z.array(ProductInventoryListRowSchema);

export type InventoryListParams = {
  page?: number;
  page_size?: number;
  search?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
  category_id?: string;
  brand?: string;
  engine?: string;
  search_type?: InventoryListSearchType;
  /** When false, include products that do not track inventory (Products page). */
  tracked_only?: boolean;
};

export const PURCHASE_DETAIL_KINDS = ["LOCAL", "IMPORT"] as const;
export const PurchaseDetailKindSchema = z.enum(PURCHASE_DETAIL_KINDS);
export type PurchaseDetailKind = z.infer<typeof PurchaseDetailKindSchema>;

export const PURCHASE_DETAIL_POSTING_STATUSES = ["ALL", "POSTED", "UNPOSTED"] as const;
export const PurchaseDetailPostingStatusSchema = z.enum(PURCHASE_DETAIL_POSTING_STATUSES);
export type PurchaseDetailPostingStatus = z.infer<typeof PurchaseDetailPostingStatusSchema>;

export const ProductPurchaseDetailLineSchema = z.object({
  line_id: z.string().uuid(),
  document_type: z
    .enum(["PURCHASE_INVOICE", "GOODS_RECEIPT"])
    .optional()
    .default("PURCHASE_INVOICE"),
  document_id: z.string().uuid(),
  document_number: z.string(),
  document_date: z.string(),
  product_id: z.string().uuid(),
  description: z.string(),
  party_id: z.string().uuid(),
  party_name: z.string(),
  quantity: DecimalStringSchema,
  rate: DecimalStringSchema,
  amount: DecimalStringSchema,
  currency_code: z.string().nullable().optional().default(null),
  warehouse_id: z.string().uuid().nullable().optional().default(null),
  warehouse_name: z.string().nullable().optional().default(null),
  supplier_invoice_number: z.string().nullable().optional().default(null),
  lc_date: z.string().nullable().optional().default(null),
  lc_number: z.string().nullable().optional().default(null),
  fc_rate: NullableDecimalStringSchema.optional().default(null),
  rate_lcy: NullableDecimalStringSchema.optional().default(null),
  amount_lcy: NullableDecimalStringSchema.optional().default(null),
  exchange_rate: NullableDecimalStringSchema.optional().default(null),
  branch_id: z.string().uuid().nullable().optional().default(null),
  branch_name: z.string().nullable().optional().default(null),
  is_posted: z.boolean().optional().default(false),
});
export type ProductPurchaseDetailLine = z.infer<typeof ProductPurchaseDetailLineSchema>;
export const ProductPurchaseDetailLineListSchema = z.array(ProductPurchaseDetailLineSchema);

export type ProductPurchaseDetailsParams = {
  page?: number;
  page_size?: number;
  search?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
  kind: PurchaseDetailKind;
  posting_status?: PurchaseDetailPostingStatus;
  name?: string;
};
