import { z } from "zod";

import { OPTIONAL_SELECT_NONE } from "@/config/constants";
import {
  STOCK_DOCUMENT_STATUS_LABELS,
  STOCK_DOCUMENT_STATUS_VARIANTS,
  STOCK_DOCUMENT_STATUSES,
  StockDocumentStatusSchema,
  type StockDocumentStatus,
} from "@/modules/inventory-management/stock-adjustments/schemas";
import { emptyDocumentLine } from "@/shared/components/document/schemas";
import { DecimalStringSchema, MoneySchema, NullableDecimalStringSchema } from "@/shared/lib/money";

export {
  STOCK_DOCUMENT_STATUS_LABELS,
  STOCK_DOCUMENT_STATUS_VARIANTS,
  STOCK_DOCUMENT_STATUSES,
  StockDocumentStatusSchema,
};
export type { StockDocumentStatus };

export const QC_STATUSES = ["NOT_REQUIRED", "PENDING", "PARTIAL", "CLEARED"] as const;
export const QcStatusSchema = z.enum(QC_STATUSES);
export type QcStatus = z.infer<typeof QcStatusSchema>;

export const QC_STATUS_LABELS: Record<QcStatus, string> = {
  NOT_REQUIRED: "Not required",
  PENDING: "Pending",
  PARTIAL: "Partial",
  CLEARED: "Cleared",
};

export const QC_STATUS_VARIANTS: Record<QcStatus, "muted" | "warning" | "info" | "success"> = {
  NOT_REQUIRED: "muted",
  PENDING: "warning",
  PARTIAL: "info",
  CLEARED: "success",
};

export const TAX_TREATMENTS = ["REGISTERED", "UNREGISTERED", "EXPORT", "GCC", "EXEMPT"] as const;
export const TaxTreatmentSchema = z.enum(TAX_TREATMENTS);
export type TaxTreatment = z.infer<typeof TaxTreatmentSchema>;

export const PLACES_OF_SUPPLY = [
  "ABU_DHABI",
  "DUBAI",
  "SHARJAH",
  "AJMAN",
  "UMM_AL_QUWAIN",
  "RAS_AL_KHAIMAH",
  "FUJAIRAH",
  "OUTSIDE_UAE",
] as const;
export const PlaceOfSupplySchema = z.enum(PLACES_OF_SUPPLY);
export type PlaceOfSupply = z.infer<typeof PlaceOfSupplySchema>;

export const GoodsReceiptLineSchema = z.object({
  id: z.string().uuid(),
  line_number: z.number().int(),
  purchase_order_line_id: z.string().uuid().nullable(),
  product_id: z.string().uuid().nullable(),
  supplier_product_id: z.string().uuid().nullable(),
  supplier_sku: z.string().nullable(),
  description: z.string(),
  quantity: DecimalStringSchema,
  unit_id: z.string().uuid().nullable(),
  rate: MoneySchema,
  net_weight: NullableDecimalStringSchema,
  gross_weight: NullableDecimalStringSchema,
  qty_accepted: DecimalStringSchema,
  qty_rejected: DecimalStringSchema,
  qty_on_hold: DecimalStringSchema,
  qty_billed: DecimalStringSchema.optional().default("0"),
});
export type GoodsReceiptLine = z.infer<typeof GoodsReceiptLineSchema>;

export const GoodsReceiptSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  document_number: z.string(),
  status: StockDocumentStatusSchema,
  version: z.number().int(),
  is_posted: z.boolean(),
  document_date: z.string(),
  supplier_id: z.string().uuid(),
  warehouse_id: z.string().uuid(),
  purchase_order_id: z.string().uuid().nullable(),
  branch_id: z.string().uuid().nullable(),
  tax_treatment: TaxTreatmentSchema,
  place_of_supply: PlaceOfSupplySchema,
  currency_id: z.string().uuid(),
  base_currency_id: z.string().uuid(),
  exchange_rate: MoneySchema,
  supplier_invoice_number: z.string().nullable(),
  delivery_challan_number: z.string().nullable(),
  bill_of_entry_number: z.string().nullable(),
  bill_of_entry_date: z.string().nullable(),
  container_number: z.string().nullable(),
  bl_number: z.string().nullable(),
  notes: z.string().nullable(),
  qc_status: QcStatusSchema,
  posted_at: z.string().nullable(),
  posted_by: z.string().uuid().nullable(),
  cancelled_at: z.string().nullable(),
  cancelled_by: z.string().uuid().nullable(),
  cancel_reason: z.string().nullable(),
  available_actions: z.array(z.string()).default([]),
  period_locked: z.boolean().default(false),
  journal_entry_id: z.string().uuid().nullable().optional().default(null),
  lines: z.array(GoodsReceiptLineSchema).optional().default([]),
  created_at: z.string(),
  updated_at: z.string(),
});
export type GoodsReceipt = z.infer<typeof GoodsReceiptSchema>;

export const GoodsReceiptListSchema = z.array(GoodsReceiptSchema);

export const GoodsReceiptLineInputSchema = z.object({
  purchase_order_line_id: z.string().uuid().nullable().optional(),
  product_id: z.string().uuid().nullable().optional(),
  supplier_product_id: z.string().uuid().nullable().optional(),
  supplier_sku: z.string().max(80).nullable().optional(),
  description: z.string().nullable().optional(),
  quantity: DecimalStringSchema,
  unit_id: z.string().uuid().nullable().optional(),
  rate: MoneySchema.optional(),
  net_weight: NullableDecimalStringSchema.optional(),
  gross_weight: NullableDecimalStringSchema.optional(),
});
export type GoodsReceiptLineInput = z.infer<typeof GoodsReceiptLineInputSchema>;

export const GoodsReceiptCreateRequestSchema = z.object({
  supplier_id: z.string().uuid(),
  warehouse_id: z.string().uuid(),
  document_date: z.string().nullable().optional(),
  purchase_order_id: z.string().uuid().nullable().optional(),
  branch_id: z.string().uuid().nullable().optional(),
  currency_id: z.string().uuid().nullable().optional(),
  supplier_invoice_number: z.string().max(80).nullable().optional(),
  delivery_challan_number: z.string().max(80).nullable().optional(),
  bill_of_entry_number: z.string().max(80).nullable().optional(),
  bill_of_entry_date: z.string().nullable().optional(),
  container_number: z.string().max(80).nullable().optional(),
  bl_number: z.string().max(80).nullable().optional(),
  notes: z.string().nullable().optional(),
  lines: z.array(GoodsReceiptLineInputSchema).min(1),
});
export type GoodsReceiptCreateRequest = z.infer<typeof GoodsReceiptCreateRequestSchema>;

export const GoodsReceiptUpdateRequestSchema = z.object({
  warehouse_id: z.string().uuid().nullable().optional(),
  document_date: z.string().nullable().optional(),
  branch_id: z.string().uuid().nullable().optional(),
  currency_id: z.string().uuid().nullable().optional(),
  supplier_invoice_number: z.string().max(80).nullable().optional(),
  delivery_challan_number: z.string().max(80).nullable().optional(),
  bill_of_entry_number: z.string().max(80).nullable().optional(),
  bill_of_entry_date: z.string().nullable().optional(),
  container_number: z.string().max(80).nullable().optional(),
  bl_number: z.string().max(80).nullable().optional(),
  notes: z.string().nullable().optional(),
  lines: z.array(GoodsReceiptLineInputSchema).min(1).nullable().optional(),
  version: z.number().int().optional(),
});
export type GoodsReceiptUpdateRequest = z.infer<typeof GoodsReceiptUpdateRequestSchema>;

export const GoodsReceiptCreateFromPurchaseOrderSchema = z.object({
  purchase_order_id: z.string().uuid(),
  warehouse_id: z.string().uuid().nullable().optional(),
  document_date: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});
export type GoodsReceiptCreateFromPurchaseOrder = z.infer<
  typeof GoodsReceiptCreateFromPurchaseOrderSchema
>;

export const GoodsReceiptLineFormSchema = z.object({
  product_id: z.string(),
  supplier_product_id: z.string(),
  supplier_sku: z.string(),
  description: z.string(),
  quantity: z.string(),
  unit_id: z.string(),
  rate: z.string(),
  discount_type: z.string(),
  discount_value: z.string(),
  tax_id: z.string(),
  net_weight: z.string(),
  gross_weight: z.string(),
  purchase_order_line_id: z.string(),
});
export type GoodsReceiptLineFormValues = z.infer<typeof GoodsReceiptLineFormSchema>;

const POSITIVE_DECIMAL = /^(?:0*[1-9]\d*(?:\.\d+)?|0+\.\d*[1-9]\d*)$/;

function hasId(value: string): boolean {
  return Boolean(value) && value !== OPTIONAL_SELECT_NONE;
}

export function emptyGoodsReceiptLine(): GoodsReceiptLineFormValues {
  return {
    ...emptyDocumentLine(),
    quantity: "",
  };
}

export function isBlankGoodsReceiptLine(line: GoodsReceiptLineFormValues): boolean {
  return (
    !hasId(line.product_id) &&
    !hasId(line.supplier_product_id) &&
    !line.supplier_sku.trim() &&
    !line.description.trim() &&
    !line.quantity.trim()
  );
}

export const GoodsReceiptFormSchema = z
  .object({
    supplier_id: z
      .string()
      .refine((value) => hasId(value), "Select a supplier"),
    warehouse_id: z
      .string()
      .refine((value) => hasId(value), "Select a warehouse"),
    document_date: z.string().min(1, "Enter a date"),
    purchase_order_id: z.string(),
    branch_id: z.string(),
    currency_id: z.string(),
    supplier_invoice_number: z.string().max(80),
    delivery_challan_number: z.string().max(80),
    bill_of_entry_number: z.string().max(80),
    bill_of_entry_date: z.string(),
    container_number: z.string().max(80),
    bl_number: z.string().max(80),
    notes: z.string(),
    lines: z.array(GoodsReceiptLineFormSchema),
  })
  .superRefine((values, ctx) => {
    const filled = values.lines.filter((line) => !isBlankGoodsReceiptLine(line));
    if (filled.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["lines"],
        message: "Add at least one receive line",
      });
    }
    values.lines.forEach((line, index) => {
      if (isBlankGoodsReceiptLine(line)) {
        return;
      }
      if (!hasId(line.product_id) && !hasId(line.supplier_product_id) && !line.supplier_sku.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["lines", index, "product_id"],
          message: "Select a product or supplier SKU",
        });
      }
      if (!POSITIVE_DECIMAL.test(line.quantity.trim())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["lines", index, "quantity"],
          message: "Enter a quantity greater than 0",
        });
      }
    });
  });
export type GoodsReceiptFormValues = z.infer<typeof GoodsReceiptFormSchema>;

export const GoodsReceiptFromPoFormSchema = z.object({
  purchase_order_id: z.string().uuid("Select a purchase order"),
  warehouse_id: z.string(),
  document_date: z.string().min(1, "Enter a date"),
  notes: z.string(),
});
export type GoodsReceiptFromPoFormValues = z.infer<typeof GoodsReceiptFromPoFormSchema>;

export type GoodsReceiptListParams = {
  page?: number;
  page_size?: number;
  search?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
  status?: StockDocumentStatus;
  warehouse_id?: string;
  supplier_id?: string;
  purchase_order_id?: string;
  qc_status?: QcStatus;
  product_id?: string;
  document_date_from?: string;
  document_date_to?: string;
};

export function goodsReceiptDisplayNumber(
  document: Pick<GoodsReceipt, "document_number">,
): string | null {
  const value = document.document_number.trim();
  return value ? value : null;
}

export function parseQcStatus(value: string | undefined): QcStatus | undefined {
  return QC_STATUSES.includes(value as QcStatus) ? (value as QcStatus) : undefined;
}

export function qtyIsPositive(value: string): boolean {
  return POSITIVE_DECIMAL.test(value.trim());
}
