import { z } from "zod";

import { OPTIONAL_SELECT_NONE } from "@/config/constants";
import {
  STOCK_DOCUMENT_STATUS_LABELS,
  STOCK_DOCUMENT_STATUS_VARIANTS,
  STOCK_DOCUMENT_STATUSES,
  StockDocumentStatusSchema,
  type StockDocumentStatus,
} from "@/modules/inventory-management/stock-adjustments/schemas";
import { DecimalStringSchema, MoneySchema } from "@/shared/lib/money";

export {
  STOCK_DOCUMENT_STATUS_LABELS,
  STOCK_DOCUMENT_STATUS_VARIANTS,
  STOCK_DOCUMENT_STATUSES,
  StockDocumentStatusSchema,
};
export type { StockDocumentStatus };

export const TAX_TREATMENTS = ["REGISTERED", "UNREGISTERED", "EXPORT", "GCC", "EXEMPT"] as const;
export const TaxTreatmentSchema = z.enum(TAX_TREATMENTS);

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

export const DeliveryNoteLineSchema = z.object({
  id: z.string().uuid(),
  line_number: z.number().int(),
  sales_order_line_id: z.string().uuid(),
  product_id: z.string().uuid().nullable(),
  description: z.string(),
  quantity: DecimalStringSchema,
  unit_id: z.string().uuid().nullable(),
  rate: MoneySchema,
  qty_invoiced: DecimalStringSchema.optional().default("0"),
});
export type DeliveryNoteLine = z.infer<typeof DeliveryNoteLineSchema>;

export const DeliveryNoteSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  document_number: z.string(),
  status: StockDocumentStatusSchema,
  version: z.number().int(),
  is_posted: z.boolean(),
  document_date: z.string(),
  sales_order_id: z.string().uuid(),
  customer_id: z.string().uuid(),
  warehouse_id: z.string().uuid(),
  branch_id: z.string().uuid().nullable(),
  shipment_id: z.string().uuid().nullable(),
  tax_treatment: TaxTreatmentSchema,
  place_of_supply: PlaceOfSupplySchema,
  currency_id: z.string().uuid(),
  base_currency_id: z.string().uuid(),
  exchange_rate: MoneySchema,
  vehicle_number: z.string().nullable(),
  driver_name: z.string().nullable(),
  driver_contact: z.string().nullable(),
  notes: z.string().nullable(),
  posted_at: z.string().nullable(),
  posted_by: z.string().uuid().nullable(),
  cancelled_at: z.string().nullable(),
  cancelled_by: z.string().uuid().nullable(),
  cancel_reason: z.string().nullable(),
  available_actions: z.array(z.string()).default([]),
  period_locked: z.boolean().default(false),
  journal_entry_id: z.string().uuid().nullable().optional().default(null),
  lines: z.array(DeliveryNoteLineSchema).optional().default([]),
  created_at: z.string(),
  updated_at: z.string(),
});
export type DeliveryNote = z.infer<typeof DeliveryNoteSchema>;
export const DeliveryNoteListSchema = z.array(DeliveryNoteSchema);

export const DeliveryNoteLineInputSchema = z.object({
  sales_order_line_id: z.string().uuid(),
  product_id: z.string().uuid().nullable().optional(),
  description: z.string().nullable().optional(),
  quantity: DecimalStringSchema,
  unit_id: z.string().uuid().nullable().optional(),
  rate: MoneySchema.optional(),
});
export type DeliveryNoteLineInput = z.infer<typeof DeliveryNoteLineInputSchema>;

export const DeliveryNoteCreateRequestSchema = z.object({
  sales_order_id: z.string().uuid(),
  warehouse_id: z.string().uuid().nullable().optional(),
  document_date: z.string().nullable().optional(),
  branch_id: z.string().uuid().nullable().optional(),
  currency_id: z.string().uuid().nullable().optional(),
  vehicle_number: z.string().max(80).nullable().optional(),
  driver_name: z.string().max(120).nullable().optional(),
  driver_contact: z.string().max(40).nullable().optional(),
  notes: z.string().nullable().optional(),
  lines: z.array(DeliveryNoteLineInputSchema).min(1),
});
export type DeliveryNoteCreateRequest = z.infer<typeof DeliveryNoteCreateRequestSchema>;

export const DeliveryNoteUpdateRequestSchema = z.object({
  warehouse_id: z.string().uuid().nullable().optional(),
  document_date: z.string().nullable().optional(),
  branch_id: z.string().uuid().nullable().optional(),
  currency_id: z.string().uuid().nullable().optional(),
  vehicle_number: z.string().max(80).nullable().optional(),
  driver_name: z.string().max(120).nullable().optional(),
  driver_contact: z.string().max(40).nullable().optional(),
  notes: z.string().nullable().optional(),
  lines: z.array(DeliveryNoteLineInputSchema).min(1).nullable().optional(),
  version: z.number().int().optional(),
});
export type DeliveryNoteUpdateRequest = z.infer<typeof DeliveryNoteUpdateRequestSchema>;

export const DeliveryNoteCreateFromSalesOrderSchema = z.object({
  sales_order_id: z.string().uuid(),
  warehouse_id: z.string().uuid().nullable().optional(),
  document_date: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});
export type DeliveryNoteCreateFromSalesOrder = z.infer<typeof DeliveryNoteCreateFromSalesOrderSchema>;

export const DeliveryNoteLineFormSchema = z.object({
  sales_order_line_id: z.string(),
  product_id: z.string(),
  description: z.string(),
  quantity: z.string(),
  outstanding: z.string(),
  unit_id: z.string(),
  rate: z.string(),
});
export type DeliveryNoteLineFormValues = z.infer<typeof DeliveryNoteLineFormSchema>;

const POSITIVE_DECIMAL = /^(?:0*[1-9]\d*(?:\.\d+)?|0+\.\d*[1-9]\d*)$/;

function hasId(value: string): boolean {
  return Boolean(value) && value !== OPTIONAL_SELECT_NONE;
}

export function emptyDeliveryNoteLine(): DeliveryNoteLineFormValues {
  return {
    sales_order_line_id: "",
    product_id: OPTIONAL_SELECT_NONE,
    description: "",
    quantity: "",
    outstanding: "",
    unit_id: OPTIONAL_SELECT_NONE,
    rate: "",
  };
}

export function isBlankDeliveryNoteLine(line: DeliveryNoteLineFormValues): boolean {
  return !line.sales_order_line_id.trim() && !line.quantity.trim();
}

export const DeliveryNoteFormSchema = z
  .object({
    sales_order_id: z.string().refine((value) => hasId(value), "Select a sales order"),
    warehouse_id: z.string(),
    document_date: z.string().min(1, "Enter a date"),
    branch_id: z.string(),
    currency_id: z.string(),
    vehicle_number: z.string().max(80),
    driver_name: z.string().max(120),
    driver_contact: z.string().max(40),
    notes: z.string(),
    lines: z.array(DeliveryNoteLineFormSchema),
  })
  .superRefine((values, ctx) => {
    const filled = values.lines.filter((line) => !isBlankDeliveryNoteLine(line));
    if (filled.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["lines"],
        message: "Add at least one delivery line",
      });
    }
    values.lines.forEach((line, index) => {
      if (isBlankDeliveryNoteLine(line)) {
        return;
      }
      if (!line.sales_order_line_id.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["lines", index, "sales_order_line_id"],
          message: "Line must come from the sales order",
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
export type DeliveryNoteFormValues = z.infer<typeof DeliveryNoteFormSchema>;

export const DeliveryNoteFromSalesOrderFormSchema = z.object({
  sales_order_id: z.string().uuid("Select a sales order"),
  warehouse_id: z.string(),
  document_date: z.string().min(1, "Enter a date"),
  notes: z.string(),
});
export type DeliveryNoteFromSalesOrderFormValues = z.infer<
  typeof DeliveryNoteFromSalesOrderFormSchema
>;

export type DeliveryNoteListParams = {
  page?: number;
  page_size?: number;
  search?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
  status?: StockDocumentStatus;
  sales_order_id?: string;
  customer_id?: string;
  warehouse_id?: string;
  shipment_id?: string;
  unshipped?: boolean;
  product_id?: string;
  document_date_from?: string;
  document_date_to?: string;
};

export function deliveryNoteDisplayNumber(
  document: Pick<DeliveryNote, "document_number">,
): string | null {
  const value = document.document_number.trim();
  return value ? value : null;
}

export function qtyIsPositive(value: string): boolean {
  return POSITIVE_DECIMAL.test(value.trim());
}
