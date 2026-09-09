import { z } from "zod";

import { OPTIONAL_SELECT_NONE } from "@/config/constants";
import { DecimalStringSchema, MoneySchema } from "@/shared/lib/money";

export const PURCHASE_ORDER_STATUSES = [
  "DRAFT",
  "PENDING_APPROVAL",
  "APPROVED",
  "REJECTED",
  "ISSUED",
  "CLOSED",
  "CANCELLED",
] as const;
export const PurchaseOrderStatusSchema = z.enum(PURCHASE_ORDER_STATUSES);
export type PurchaseOrderStatus = z.infer<typeof PurchaseOrderStatusSchema>;

export const PURCHASE_ORDER_STATUS_LABELS: Record<PurchaseOrderStatus, string> = {
  DRAFT: "Draft",
  PENDING_APPROVAL: "Pending approval",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  ISSUED: "Issued",
  CLOSED: "Closed",
  CANCELLED: "Cancelled",
};

export const PURCHASE_ORDER_STATUS_VARIANTS: Record<
  PurchaseOrderStatus,
  "muted" | "warning" | "info" | "success" | "destructive" | "secondary"
> = {
  DRAFT: "muted",
  PENDING_APPROVAL: "warning",
  APPROVED: "info",
  ISSUED: "success",
  REJECTED: "destructive",
  CANCELLED: "destructive",
  CLOSED: "secondary",
};

export const RECEIPT_STATUSES = ["NOT_RECEIVED", "PARTIALLY_RECEIVED", "RECEIVED"] as const;
export const ReceiptStatusSchema = z.enum(RECEIPT_STATUSES);
export type ReceiptStatus = z.infer<typeof ReceiptStatusSchema>;

export const RECEIPT_STATUS_LABELS: Record<ReceiptStatus, string> = {
  NOT_RECEIVED: "Not received",
  PARTIALLY_RECEIVED: "Partially received",
  RECEIVED: "Received",
};

export const RECEIPT_STATUS_VARIANTS: Record<ReceiptStatus, "muted" | "warning" | "success"> = {
  NOT_RECEIVED: "muted",
  PARTIALLY_RECEIVED: "warning",
  RECEIVED: "success",
};

export const BILLING_STATUSES = ["NOT_INVOICED", "PARTIALLY_INVOICED", "INVOICED"] as const;
export const BillingStatusSchema = z.enum(BILLING_STATUSES);
export type BillingStatus = z.infer<typeof BillingStatusSchema>;

export const BILLING_STATUS_LABELS: Record<BillingStatus, string> = {
  NOT_INVOICED: "Not invoiced",
  PARTIALLY_INVOICED: "Partially invoiced",
  INVOICED: "Invoiced",
};

export const BILLING_STATUS_VARIANTS: Record<BillingStatus, "muted" | "warning" | "success"> = {
  NOT_INVOICED: "muted",
  PARTIALLY_INVOICED: "warning",
  INVOICED: "success",
};

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

export const PLACE_OF_SUPPLY_LABELS: Record<PlaceOfSupply, string> = {
  ABU_DHABI: "Abu Dhabi",
  DUBAI: "Dubai",
  SHARJAH: "Sharjah",
  AJMAN: "Ajman",
  UMM_AL_QUWAIN: "Umm Al Quwain",
  RAS_AL_KHAIMAH: "Ras Al Khaimah",
  FUJAIRAH: "Fujairah",
  OUTSIDE_UAE: "Outside UAE",
};

export const DISCOUNT_TYPES = ["PERCENTAGE", "AMOUNT"] as const;
export const DiscountTypeSchema = z.enum(DISCOUNT_TYPES);
export type DiscountType = z.infer<typeof DiscountTypeSchema>;

export const DISCOUNT_TYPE_LABELS: Record<DiscountType, string> = {
  PERCENTAGE: "Percentage",
  AMOUNT: "Amount",
};

export const TAX_TREATMENTS = ["REGISTERED", "UNREGISTERED", "EXPORT", "GCC", "EXEMPT"] as const;
export const TaxTreatmentSchema = z.enum(TAX_TREATMENTS);
export type TaxTreatment = z.infer<typeof TaxTreatmentSchema>;

export const TAX_TREATMENT_LABELS: Record<TaxTreatment, string> = {
  REGISTERED: "Registered",
  UNREGISTERED: "Unregistered",
  EXPORT: "Export",
  GCC: "GCC",
  EXEMPT: "Exempt",
};

export const PurchaseOrderLineSchema = z.object({
  id: z.string().uuid(),
  line_number: z.number().int(),
  product_id: z.string().uuid().nullable(),
  supplier_product_id: z.string().uuid().nullable().optional().default(null),
  supplier_sku: z.string().nullable().optional().default(null),
  description: z.string(),
  quantity: DecimalStringSchema,
  unit_id: z.string().uuid().nullable(),
  rate: MoneySchema,
  discount_type: DiscountTypeSchema.nullable(),
  discount_value: MoneySchema.nullable(),
  discount_amount: MoneySchema,
  tax_id: z.string().uuid().nullable(),
  tax_rate: MoneySchema,
  tax_amount: MoneySchema,
  amount: MoneySchema,
  qty_received: DecimalStringSchema,
  qty_billed: DecimalStringSchema,
  source_sales_order_line_id: z.string().uuid().nullable().optional().default(null),
});
export type PurchaseOrderLine = z.infer<typeof PurchaseOrderLineSchema>;

export const PurchaseOrderSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  document_number: z.string(),
  status: PurchaseOrderStatusSchema,
  version: z.number().int(),
  is_posted: z.boolean(),
  reference_number: z.string().nullable(),
  order_date: z.string(),
  document_date: z.string(),
  expected_delivery_date: z.string().nullable(),
  branch_id: z.string().uuid().nullable(),
  warehouse_id: z.string().uuid().nullable(),
  supplier_id: z.string().uuid(),
  contact_id: z.string().uuid().nullable(),
  supplier_trn: z.string().nullable(),
  tax_treatment: TaxTreatmentSchema,
  place_of_supply: PlaceOfSupplySchema,
  currency_id: z.string().uuid(),
  base_currency_id: z.string().uuid(),
  exchange_rate: MoneySchema,
  payment_terms_id: z.string().uuid().nullable(),
  notes: z.string().nullable(),
  terms_and_conditions: z.string().nullable(),
  supplier_address_snapshot: z.string().nullable(),
  deliver_to_snapshot: z.string().nullable(),
  discount_type: DiscountTypeSchema.nullable(),
  discount_value: MoneySchema.nullable(),
  discount_amount: MoneySchema,
  shipping_amount: MoneySchema,
  adjustment_amount: MoneySchema,
  subtotal: MoneySchema,
  tax_amount: MoneySchema,
  grand_total: MoneySchema,
  foreign_amount: MoneySchema,
  base_amount: MoneySchema,
  receipt_status: ReceiptStatusSchema,
  billing_status: BillingStatusSchema,
  issued_at: z.string().nullable(),
  issued_by: z.string().uuid().nullable(),
  closed_at: z.string().nullable(),
  closed_by: z.string().uuid().nullable(),
  cancelled_at: z.string().nullable(),
  cancelled_by: z.string().uuid().nullable(),
  cancel_reason: z.string().nullable(),
  source_sales_order_id: z.string().uuid().nullable().optional().default(null),
  available_actions: z.array(z.string()).default([]),
  lines: z.array(PurchaseOrderLineSchema).optional().default([]),
  created_at: z.string(),
  updated_at: z.string(),
});
export type PurchaseOrder = z.infer<typeof PurchaseOrderSchema>;

export const PurchaseOrderListSchema = z.array(PurchaseOrderSchema);

export const PurchaseOrderComposeDefaultsSchema = z.object({
  supplier_id: z.string().uuid(),
  supplier_name: z.string(),
  supplier_trn: z.string().nullable(),
  tax_treatment: TaxTreatmentSchema,
  currency_id: z.string().uuid(),
  payment_terms_id: z.string().uuid().nullable(),
  contact_id: z.string().uuid().nullable(),
  warehouse_id: z.string().uuid().nullable(),
  place_of_supply: PlaceOfSupplySchema,
  supplier_address_snapshot: z.string().nullable(),
  deliver_to_snapshot: z.string().nullable(),
  terms_and_conditions: z.string().nullable(),
});
export type PurchaseOrderComposeDefaults = z.infer<typeof PurchaseOrderComposeDefaultsSchema>;

export const PurchaseOrderLineInputSchema = z.object({
  product_id: z.string().uuid().nullable().optional(),
  supplier_product_id: z.string().uuid().nullable().optional(),
  description: z.string().nullable().optional(),
  quantity: DecimalStringSchema,
  unit_id: z.string().uuid().nullable().optional(),
  rate: MoneySchema.nullable().optional(),
  discount_type: DiscountTypeSchema.nullable().optional(),
  discount_value: MoneySchema.nullable().optional(),
  tax_id: z.string().uuid().nullable().optional(),
});
export type PurchaseOrderLineInput = z.infer<typeof PurchaseOrderLineInputSchema>;

export const PurchaseOrderCreateRequestSchema = z.object({
  supplier_id: z.string().uuid(),
  contact_id: z.string().uuid().nullable().optional(),
  branch_id: z.string().uuid().nullable().optional(),
  warehouse_id: z.string().uuid().nullable().optional(),
  order_date: z.string().nullable().optional(),
  expected_delivery_date: z.string().nullable().optional(),
  reference_number: z.string().max(60).nullable().optional(),
  currency_id: z.string().uuid().nullable().optional(),
  payment_terms_id: z.string().uuid().nullable().optional(),
  notes: z.string().nullable().optional(),
  terms_and_conditions: z.string().nullable().optional(),
  terms_template_id: z.string().uuid().nullable().optional(),
  discount_type: DiscountTypeSchema.nullable().optional(),
  discount_value: MoneySchema.nullable().optional(),
  shipping_amount: MoneySchema.optional(),
  adjustment_amount: MoneySchema.optional(),
  place_of_supply: PlaceOfSupplySchema.nullable().optional(),
  lines: z.array(PurchaseOrderLineInputSchema).optional(),
});
export type PurchaseOrderCreateRequest = z.infer<typeof PurchaseOrderCreateRequestSchema>;

export const PurchaseOrderUpdateRequestSchema = z.object({
  contact_id: z.string().uuid().nullable().optional(),
  branch_id: z.string().uuid().nullable().optional(),
  warehouse_id: z.string().uuid().nullable().optional(),
  order_date: z.string().nullable().optional(),
  expected_delivery_date: z.string().nullable().optional(),
  reference_number: z.string().max(60).nullable().optional(),
  currency_id: z.string().uuid().nullable().optional(),
  payment_terms_id: z.string().uuid().nullable().optional(),
  notes: z.string().nullable().optional(),
  terms_and_conditions: z.string().nullable().optional(),
  discount_type: DiscountTypeSchema.nullable().optional(),
  discount_value: MoneySchema.nullable().optional(),
  shipping_amount: MoneySchema.nullable().optional(),
  adjustment_amount: MoneySchema.nullable().optional(),
  place_of_supply: PlaceOfSupplySchema.nullable().optional(),
  lines: z.array(PurchaseOrderLineInputSchema).nullable().optional(),
  version: z.number().int().optional(),
});
export type PurchaseOrderUpdateRequest = z.infer<typeof PurchaseOrderUpdateRequestSchema>;

export const PurchaseOrderLineFormSchema = z.object({
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
});
export type PurchaseOrderLineFormValues = z.infer<typeof PurchaseOrderLineFormSchema>;

const POSITIVE_DECIMAL = /^(?:0*[1-9]\d*(?:\.\d+)?|0+\.\d*[1-9]\d*)$/;

function hasProductId(value: string): boolean {
  return Boolean(value) && value !== OPTIONAL_SELECT_NONE;
}

function hasCatalogId(value: string): boolean {
  return Boolean(value) && value !== OPTIONAL_SELECT_NONE;
}

export function isBlankPurchaseOrderLine(line: PurchaseOrderLineFormValues): boolean {
  return (
    !hasProductId(line.product_id) &&
    !hasCatalogId(line.supplier_product_id) &&
    !line.description.trim()
  );
}

export const PurchaseOrderFormSchema = z
  .object({
    supplier_id: z
      .string()
      .refine((value) => value !== OPTIONAL_SELECT_NONE && Boolean(value), "Select a supplier"),
    contact_id: z.string(),
    branch_id: z.string(),
    warehouse_id: z.string(),
    order_date: z.string(),
    expected_delivery_date: z.string(),
    reference_number: z.string().max(60),
    currency_id: z.string(),
    payment_terms_id: z.string(),
    notes: z.string(),
    terms_and_conditions: z.string(),
    terms_template_id: z.string(),
    discount_type: z.string(),
    discount_value: z.string(),
    shipping_amount: z.string(),
    adjustment_amount: z.string(),
    place_of_supply: z.string(),
    supplier_trn: z.string(),
    tax_treatment: z.string(),
    supplier_address_snapshot: z.string(),
    deliver_to_snapshot: z.string(),
    lines: z.array(PurchaseOrderLineFormSchema),
  })
  .superRefine((values, ctx) => {
    values.lines.forEach((line, index) => {
      if (isBlankPurchaseOrderLine(line)) {
        return;
      }
      if (!hasProductId(line.product_id) && !line.rate.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["lines", index, "rate"],
          message: "Enter a rate",
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
export type PurchaseOrderFormValues = z.infer<typeof PurchaseOrderFormSchema>;

export type PurchaseOrderListParams = {
  page?: number;
  page_size?: number;
  search?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
  status?: PurchaseOrderStatus;
  receipt_status?: ReceiptStatus;
  billing_status?: BillingStatus;
  supplier_id?: string;
  branch_id?: string;
  warehouse_id?: string;
  currency_id?: string;
  source_sales_order_id?: string;
};

export function purchaseOrderDisplayNumber(
  order: Pick<PurchaseOrder, "document_number">,
): string | null {
  const value = (order.document_number || "").trim();
  return value ? value : null;
}
