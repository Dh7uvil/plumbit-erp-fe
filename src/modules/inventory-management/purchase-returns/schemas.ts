import { z } from "zod";

import { OPTIONAL_SELECT_NONE } from "@/config/constants";
import {
  STOCK_DOCUMENT_STATUS_LABELS,
  STOCK_DOCUMENT_STATUS_VARIANTS,
  STOCK_DOCUMENT_STATUSES,
  StockDocumentStatusSchema,
  type StockDocumentStatus,
} from "@/modules/inventory-management/stock-adjustments/schemas";
import { RelatedDocumentRefSchema } from "@/shared/components/document/schemas";
import { DecimalStringSchema, MoneySchema } from "@/shared/lib/money";

export {
  STOCK_DOCUMENT_STATUS_LABELS,
  STOCK_DOCUMENT_STATUS_VARIANTS,
  STOCK_DOCUMENT_STATUSES,
  StockDocumentStatusSchema,
};
export type { StockDocumentStatus };

export const PURCHASE_RETURN_REASONS = [
  "DAMAGED",
  "QUALITY_REJECTION",
  "WRONG_ITEM",
  "OVER_SHIPMENT",
  "OTHER",
] as const;
export const PurchaseReturnReasonSchema = z.enum(PURCHASE_RETURN_REASONS);
export type PurchaseReturnReason = z.infer<typeof PurchaseReturnReasonSchema>;
export const PURCHASE_RETURN_REASON_LABELS: Record<PurchaseReturnReason, string> = {
  DAMAGED: "Damaged",
  QUALITY_REJECTION: "Quality rejection",
  WRONG_ITEM: "Wrong item",
  OVER_SHIPMENT: "Over shipment",
  OTHER: "Other",
};

export const PURCHASE_RETURN_DISPOSITIONS = ["RETURN_TO_SUPPLIER"] as const;
export const PurchaseReturnDispositionSchema = z.enum(PURCHASE_RETURN_DISPOSITIONS);
export type PurchaseReturnDisposition = z.infer<typeof PurchaseReturnDispositionSchema>;
export const PURCHASE_RETURN_DISPOSITION_LABELS: Record<PurchaseReturnDisposition, string> = {
  RETURN_TO_SUPPLIER: "Return to supplier",
};
export const PURCHASE_RETURN_DISPOSITION_HELP: Record<PurchaseReturnDisposition, string> = {
  RETURN_TO_SUPPLIER:
    "Posts an outbound stock move against the original GRN cost layers. AP is reduced later with a debit note.",
};

export const PurchaseReturnLineSchema = z.object({
  id: z.string().uuid(),
  line_number: z.number().int(),
  goods_receipt_line_id: z.string().uuid(),
  product_id: z.string().uuid().nullable(),
  quantity: DecimalStringSchema,
  unit_id: z.string().uuid().nullable(),
  rate: MoneySchema,
  disposition: PurchaseReturnDispositionSchema,
  notes: z.string().nullable(),
});
export type PurchaseReturnLine = z.infer<typeof PurchaseReturnLineSchema>;

export const PurchaseReturnSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  document_number: z.string(),
  status: StockDocumentStatusSchema,
  version: z.number().int(),
  is_posted: z.boolean(),
  document_date: z.string(),
  goods_receipt_id: z.string().uuid(),
  purchase_order_id: z.string().uuid().nullable(),
  supplier_id: z.string().uuid(),
  warehouse_id: z.string().uuid(),
  reason_code: PurchaseReturnReasonSchema,
  notes: z.string().nullable(),
  posted_at: z.string().nullable(),
  posted_by: z.string().uuid().nullable(),
  cancelled_at: z.string().nullable(),
  cancelled_by: z.string().uuid().nullable(),
  cancel_reason: z.string().nullable(),
  available_actions: z.array(z.string()).default([]),
  period_locked: z.boolean().default(false),
  related_documents: z.array(RelatedDocumentRefSchema).optional().default([]),
  lines: z.array(PurchaseReturnLineSchema).optional().default([]),
  created_at: z.string(),
  updated_at: z.string(),
});
export type PurchaseReturn = z.infer<typeof PurchaseReturnSchema>;
export const PurchaseReturnListSchema = z.array(PurchaseReturnSchema);

export const PurchaseReturnLineInputSchema = z.object({
  goods_receipt_line_id: z.string().uuid(),
  product_id: z.string().uuid().nullable().optional(),
  quantity: DecimalStringSchema,
  unit_id: z.string().uuid().nullable().optional(),
  rate: MoneySchema.optional(),
  disposition: PurchaseReturnDispositionSchema.optional(),
  notes: z.string().nullable().optional(),
});
export type PurchaseReturnLineInput = z.infer<typeof PurchaseReturnLineInputSchema>;

export const PurchaseReturnCreateRequestSchema = z.object({
  goods_receipt_id: z.string().uuid(),
  document_date: z.string().nullable().optional(),
  reason_code: PurchaseReturnReasonSchema,
  notes: z.string().nullable().optional(),
  lines: z.array(PurchaseReturnLineInputSchema).min(1),
});
export type PurchaseReturnCreateRequest = z.infer<typeof PurchaseReturnCreateRequestSchema>;

export const PurchaseReturnUpdateRequestSchema = z.object({
  document_date: z.string().nullable().optional(),
  reason_code: PurchaseReturnReasonSchema.nullable().optional(),
  notes: z.string().nullable().optional(),
  lines: z.array(PurchaseReturnLineInputSchema).min(1).nullable().optional(),
  version: z.number().int().optional(),
});
export type PurchaseReturnUpdateRequest = z.infer<typeof PurchaseReturnUpdateRequestSchema>;

export const PurchaseReturnLineFormSchema = z.object({
  goods_receipt_line_id: z.string(),
  product_id: z.string(),
  description: z.string(),
  quantity: z.string(),
  unit_id: z.string(),
  rate: z.string(),
  disposition: z.string(),
  notes: z.string(),
});
export type PurchaseReturnLineFormValues = z.infer<typeof PurchaseReturnLineFormSchema>;

const POSITIVE_DECIMAL = /^(?:0*[1-9]\d*(?:\.\d+)?|0+\.\d*[1-9]\d*)$/;

function hasId(value: string): boolean {
  return Boolean(value) && value !== OPTIONAL_SELECT_NONE;
}

export function emptyPurchaseReturnLine(): PurchaseReturnLineFormValues {
  return {
    goods_receipt_line_id: "",
    product_id: OPTIONAL_SELECT_NONE,
    description: "",
    quantity: "",
    unit_id: OPTIONAL_SELECT_NONE,
    rate: "",
    disposition: "RETURN_TO_SUPPLIER",
    notes: "",
  };
}

export function isBlankPurchaseReturnLine(line: PurchaseReturnLineFormValues): boolean {
  return !line.goods_receipt_line_id.trim() && !line.quantity.trim();
}

export const PurchaseReturnFormSchema = z
  .object({
    goods_receipt_id: z.string().refine((value) => hasId(value), "Select a goods receipt"),
    document_date: z.string().min(1, "Enter a date"),
    reason_code: PurchaseReturnReasonSchema,
    notes: z.string(),
    lines: z.array(PurchaseReturnLineFormSchema),
  })
  .superRefine((values, ctx) => {
    const filled = values.lines.filter((line) => !isBlankPurchaseReturnLine(line));
    if (filled.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["lines"],
        message: "Add at least one return line",
      });
    }
    values.lines.forEach((line, index) => {
      if (isBlankPurchaseReturnLine(line)) {
        return;
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
export type PurchaseReturnFormValues = z.infer<typeof PurchaseReturnFormSchema>;

export type PurchaseReturnListParams = {
  page?: number;
  page_size?: number;
  search?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
  status?: StockDocumentStatus;
  goods_receipt_id?: string;
  purchase_order_id?: string;
  supplier_id?: string;
  warehouse_id?: string;
  document_date_from?: string;
  document_date_to?: string;
};

export function purchaseReturnDisplayNumber(
  document: Pick<PurchaseReturn, "document_number">,
): string | null {
  const value = document.document_number.trim();
  return value ? value : null;
}
