import { z } from "zod";

export const COST_SHEET_TYPES = ["IMPORT", "EXPORT", "OTHER"] as const;
export type CostSheetType = (typeof COST_SHEET_TYPES)[number];

export const COST_SHEET_STATUSES = ["DRAFT", "CONFIRMED", "CLOSED"] as const;
export type CostSheetStatus = (typeof COST_SHEET_STATUSES)[number];

export const COST_SHEET_STATUS_LABELS: Record<CostSheetStatus, string> = {
  DRAFT: "Draft",
  CONFIRMED: "Confirmed",
  CLOSED: "Closed",
};

export const COST_SHEET_TYPE_LABELS: Record<CostSheetType, string> = {
  IMPORT: "Import",
  EXPORT: "Export",
  OTHER: "Other",
};

const money = z.string();
const qty = z.string();

export const CostSheetLineSchema = z.object({
  id: z.string().uuid(),
  line_number: z.number(),
  product_id: z.string().uuid(),
  unit_id: z.string().uuid(),
  quantity: qty,
  base_rate: money,
  target_selling_price: money.nullable(),
  goods_receipt_line_id: z.string().uuid().nullable(),
  line_goods_value: money,
  estimated_landed_unit_cost: money,
  actual_landed_unit_cost: money.nullable(),
  expected_margin_pct: money.nullable(),
});

export const CostSheetChargeSchema = z.object({
  id: z.string().uuid(),
  line_number: z.number(),
  charge_type_id: z.string().uuid(),
  estimated_amount: money,
  actual_amount: money.nullable(),
  variance_amount: money.nullable(),
  allocation_basis: z.enum(["VALUE", "WEIGHT", "QUANTITY", "VOLUME"]).nullable(),
  purchase_invoice_id: z.string().uuid().nullable(),
  purchase_invoice_line_id: z.string().uuid().nullable(),
  is_inventoriable: z.boolean(),
});

export const CostSheetTotalsSchema = z.object({
  goods_value_estimated: money,
  inventoriable_charges_estimated: money,
  inventoriable_charges_actual: money.nullable(),
  expensed_charges_estimated: money,
  expensed_charges_actual: money.nullable(),
  weighted_landed_unit_cost_estimated: money.nullable(),
  weighted_landed_unit_cost_actual: money.nullable(),
  fob_total: money.nullable(),
  cif_total: money.nullable(),
  reference_selling_total: money.nullable(),
  sheet_expected_margin_pct: money.nullable(),
});

export const CostSheetSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  document_number: z.string(),
  sheet_type: z.enum(COST_SHEET_TYPES),
  status: z.enum(COST_SHEET_STATUSES),
  version: z.number(),
  document_date: z.string(),
  shipment_id: z.string().uuid().nullable(),
  purchase_order_id: z.string().uuid().nullable(),
  supplier_id: z.string().uuid().nullable(),
  customer_id: z.string().uuid().nullable(),
  proforma_invoice_id: z.string().uuid().nullable(),
  currency_id: z.string().uuid(),
  base_currency_id: z.string().uuid(),
  exchange_rate: z.string(),
  incoterm: z.string().nullable(),
  port_of_loading: z.string().nullable(),
  port_of_discharge: z.string().nullable(),
  allocation_method: z.enum(["VALUE", "WEIGHT", "QUANTITY", "VOLUME"]),
  landed_cost_id: z.string().uuid().nullable(),
  notes: z.string().nullable(),
  totals: CostSheetTotalsSchema,
  available_actions: z.array(z.string()),
  lines: z.array(CostSheetLineSchema),
  charges: z.array(CostSheetChargeSchema),
  created_at: z.string(),
  updated_at: z.string(),
  created_by: z.string().uuid().nullable(),
  updated_by: z.string().uuid().nullable(),
});

export type CostSheet = z.infer<typeof CostSheetSchema>;
export type CostSheetLine = z.infer<typeof CostSheetLineSchema>;
export type CostSheetCharge = z.infer<typeof CostSheetChargeSchema>;

export const CostSheetListSchema = z.array(CostSheetSchema);

export const CostSheetLineInputSchema = z.object({
  product_id: z.string().uuid(),
  unit_id: z.string().uuid(),
  quantity: qty,
  base_rate: money,
  target_selling_price: money.optional(),
  goods_receipt_line_id: z.string().uuid().optional(),
});

export const CostSheetChargeInputSchema = z.object({
  charge_type_id: z.string().uuid(),
  estimated_amount: money.default("0"),
  actual_amount: money.optional(),
  allocation_basis: z.enum(["VALUE", "WEIGHT", "QUANTITY", "VOLUME"]).optional(),
});

export const CostSheetCreateRequestSchema = z.object({
  sheet_type: z.enum(COST_SHEET_TYPES),
  document_date: z.string().optional(),
  shipment_id: z.string().uuid().optional(),
  purchase_order_id: z.string().uuid().optional(),
  supplier_id: z.string().uuid().optional(),
  customer_id: z.string().uuid().optional(),
  proforma_invoice_id: z.string().uuid().optional(),
  currency_id: z.string().uuid().optional(),
  exchange_rate: z.string().optional(),
  incoterm: z.string().optional(),
  port_of_loading: z.string().optional(),
  port_of_discharge: z.string().optional(),
  allocation_method: z.enum(["VALUE", "WEIGHT", "QUANTITY", "VOLUME"]).optional(),
  notes: z.string().optional(),
  lines: z.array(CostSheetLineInputSchema).min(1),
  charges: z.array(CostSheetChargeInputSchema).optional(),
});

export type CostSheetCreateRequest = z.infer<typeof CostSheetCreateRequestSchema>;

export const CostSheetUpdateRequestSchema = CostSheetCreateRequestSchema.partial().extend({
  version: z.number().optional(),
  lines: z.array(CostSheetLineInputSchema).min(1).optional(),
});

export type CostSheetUpdateRequest = z.infer<typeof CostSheetUpdateRequestSchema>;

export type CostSheetListParams = {
  page?: number;
  page_size?: number;
  search?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
  status?: CostSheetStatus;
  sheet_type?: CostSheetType;
  document_date_from?: string;
  document_date_to?: string;
};
