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

export const SALES_RETURN_REASONS = [
  "DAMAGED_IN_TRANSIT",
  "WRONG_ITEM_SHIPPED",
  "QUALITY_REJECTION",
  "CUSTOMER_CANCELLATION",
  "SHORT_SHIPMENT",
  "OTHER",
] as const;
export const SalesReturnReasonSchema = z.enum(SALES_RETURN_REASONS);
export type SalesReturnReason = z.infer<typeof SalesReturnReasonSchema>;
export const SALES_RETURN_REASON_LABELS: Record<SalesReturnReason, string> = {
  DAMAGED_IN_TRANSIT: "Damaged in transit",
  WRONG_ITEM_SHIPPED: "Wrong item shipped",
  QUALITY_REJECTION: "Quality rejection",
  CUSTOMER_CANCELLATION: "Customer cancellation",
  SHORT_SHIPMENT: "Short shipment",
  OTHER: "Other",
};

export const RETURN_DISPOSITIONS = ["RESTOCK", "QC_HOLD", "SCRAP"] as const;
export const ReturnDispositionSchema = z.enum(RETURN_DISPOSITIONS);
export type ReturnDisposition = z.infer<typeof ReturnDispositionSchema>;
export const RETURN_DISPOSITION_LABELS: Record<ReturnDisposition, string> = {
  RESTOCK: "Restock",
  QC_HOLD: "QC hold",
  SCRAP: "Scrap",
};
export const RETURN_DISPOSITION_HELP: Record<ReturnDisposition, string> = {
  RESTOCK: "Returns goods to sellable stock at original cost.",
  QC_HOLD: "Restores original cost but keeps goods out of sellable stock until inspected.",
  SCRAP: "Restores original cost then writes it off as damage. Scrapped goods never become available.",
};

export const SalesReturnLineSchema = z.object({
  id: z.string().uuid(),
  line_number: z.number().int(),
  delivery_note_line_id: z.string().uuid(),
  product_id: z.string().uuid().nullable(),
  quantity: DecimalStringSchema,
  unit_id: z.string().uuid().nullable(),
  rate: MoneySchema,
  disposition: ReturnDispositionSchema,
  notes: z.string().nullable(),
});
export type SalesReturnLine = z.infer<typeof SalesReturnLineSchema>;

export const SalesReturnSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  document_number: z.string(),
  status: StockDocumentStatusSchema,
  version: z.number().int(),
  is_posted: z.boolean(),
  document_date: z.string(),
  delivery_note_id: z.string().uuid(),
  sales_order_id: z.string().uuid(),
  customer_id: z.string().uuid(),
  warehouse_id: z.string().uuid(),
  reason_code: SalesReturnReasonSchema,
  notes: z.string().nullable(),
  posted_at: z.string().nullable(),
  posted_by: z.string().uuid().nullable(),
  cancelled_at: z.string().nullable(),
  cancelled_by: z.string().uuid().nullable(),
  cancel_reason: z.string().nullable(),
  available_actions: z.array(z.string()).default([]),
  period_locked: z.boolean().default(false),
  lines: z.array(SalesReturnLineSchema).optional().default([]),
  created_at: z.string(),
  updated_at: z.string(),
});
export type SalesReturn = z.infer<typeof SalesReturnSchema>;
export const SalesReturnListSchema = z.array(SalesReturnSchema);

export const SalesReturnLineInputSchema = z.object({
  delivery_note_line_id: z.string().uuid(),
  product_id: z.string().uuid().nullable().optional(),
  quantity: DecimalStringSchema,
  unit_id: z.string().uuid().nullable().optional(),
  rate: MoneySchema.optional(),
  disposition: ReturnDispositionSchema,
  notes: z.string().nullable().optional(),
});
export type SalesReturnLineInput = z.infer<typeof SalesReturnLineInputSchema>;

export const SalesReturnCreateRequestSchema = z.object({
  delivery_note_id: z.string().uuid(),
  document_date: z.string().nullable().optional(),
  reason_code: SalesReturnReasonSchema,
  notes: z.string().nullable().optional(),
  lines: z.array(SalesReturnLineInputSchema).min(1),
});
export type SalesReturnCreateRequest = z.infer<typeof SalesReturnCreateRequestSchema>;

export const SalesReturnUpdateRequestSchema = z.object({
  document_date: z.string().nullable().optional(),
  reason_code: SalesReturnReasonSchema.nullable().optional(),
  notes: z.string().nullable().optional(),
  lines: z.array(SalesReturnLineInputSchema).min(1).nullable().optional(),
  version: z.number().int().optional(),
});
export type SalesReturnUpdateRequest = z.infer<typeof SalesReturnUpdateRequestSchema>;

export const SalesReturnLineFormSchema = z.object({
  delivery_note_line_id: z.string(),
  product_id: z.string(),
  description: z.string(),
  quantity: z.string(),
  unit_id: z.string(),
  rate: z.string(),
  disposition: z.string(),
  notes: z.string(),
});
export type SalesReturnLineFormValues = z.infer<typeof SalesReturnLineFormSchema>;

const POSITIVE_DECIMAL = /^(?:0*[1-9]\d*(?:\.\d+)?|0+\.\d*[1-9]\d*)$/;

function hasId(value: string): boolean {
  return Boolean(value) && value !== OPTIONAL_SELECT_NONE;
}

export function emptySalesReturnLine(): SalesReturnLineFormValues {
  return {
    delivery_note_line_id: "",
    product_id: OPTIONAL_SELECT_NONE,
    description: "",
    quantity: "",
    unit_id: OPTIONAL_SELECT_NONE,
    rate: "",
    disposition: "",
    notes: "",
  };
}

export function isBlankSalesReturnLine(line: SalesReturnLineFormValues): boolean {
  return !line.delivery_note_line_id.trim() && !line.quantity.trim();
}

export const SalesReturnFormSchema = z
  .object({
    delivery_note_id: z.string().refine((value) => hasId(value), "Select a delivery note"),
    document_date: z.string().min(1, "Enter a date"),
    reason_code: SalesReturnReasonSchema,
    notes: z.string(),
    lines: z.array(SalesReturnLineFormSchema),
  })
  .superRefine((values, ctx) => {
    const filled = values.lines.filter((line) => !isBlankSalesReturnLine(line));
    if (filled.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["lines"],
        message: "Add at least one return line",
      });
    }
    values.lines.forEach((line, index) => {
      if (isBlankSalesReturnLine(line)) {
        return;
      }
      if (!POSITIVE_DECIMAL.test(line.quantity.trim())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["lines", index, "quantity"],
          message: "Enter a quantity greater than 0",
        });
      }
      if (!RETURN_DISPOSITIONS.includes(line.disposition as ReturnDisposition)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["lines", index, "disposition"],
          message: "Select a disposition",
        });
      }
    });
  });
export type SalesReturnFormValues = z.infer<typeof SalesReturnFormSchema>;

export type SalesReturnListParams = {
  page?: number;
  page_size?: number;
  search?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
  status?: StockDocumentStatus;
  delivery_note_id?: string;
  sales_order_id?: string;
  customer_id?: string;
  warehouse_id?: string;
  document_date_from?: string;
  document_date_to?: string;
};

export function salesReturnDisplayNumber(
  document: Pick<SalesReturn, "document_number">,
): string | null {
  const value = document.document_number.trim();
  return value ? value : null;
}
