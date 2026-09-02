import { z } from "zod";

import { OPTIONAL_SELECT_NONE } from "@/config/constants";
import { NullableDecimalStringSchema } from "@/shared/lib/money";

export const STOCK_DOCUMENT_STATUSES = ["DRAFT", "POSTED", "CANCELLED"] as const;
export const StockDocumentStatusSchema = z.enum(STOCK_DOCUMENT_STATUSES);
export type StockDocumentStatus = z.infer<typeof StockDocumentStatusSchema>;

export const STOCK_DOCUMENT_STATUS_LABELS: Record<StockDocumentStatus, string> = {
  DRAFT: "Draft",
  POSTED: "Posted",
  CANCELLED: "Cancelled",
};

export const STOCK_ADJUSTMENT_REASONS = [
  "OPENING_STOCK",
  "COUNT",
  "DAMAGE",
  "FOUND",
  "OTHER",
] as const;
export const StockAdjustmentReasonSchema = z.enum(STOCK_ADJUSTMENT_REASONS);
export type StockAdjustmentReason = z.infer<typeof StockAdjustmentReasonSchema>;

export const STOCK_ADJUSTMENT_REASON_LABELS: Record<StockAdjustmentReason, string> = {
  OPENING_STOCK: "Opening stock",
  COUNT: "Count",
  DAMAGE: "Damage",
  FOUND: "Found",
  OTHER: "Other",
};

export const StockAdjustmentLineSchema = z.object({
  id: z.string().uuid(),
  line_number: z.number().int(),
  product_id: z.string().uuid(),
  unit_id: z.string().uuid().nullable(),
  qty_counted: NullableDecimalStringSchema,
  qty_booked: NullableDecimalStringSchema,
  qty_delta: NullableDecimalStringSchema,
  notes: z.string().nullable(),
});
export type StockAdjustmentLine = z.infer<typeof StockAdjustmentLineSchema>;

export const StockAdjustmentSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  document_number: z.string(),
  status: StockDocumentStatusSchema,
  version: z.number().int(),
  is_posted: z.boolean(),
  document_date: z.string(),
  warehouse_id: z.string().uuid(),
  reason: StockAdjustmentReasonSchema,
  branch_id: z.string().uuid().nullable(),
  reference: z.string().nullable(),
  notes: z.string().nullable(),
  posted_at: z.string().nullable(),
  posted_by: z.string().uuid().nullable(),
  cancelled_at: z.string().nullable(),
  cancelled_by: z.string().uuid().nullable(),
  cancel_reason: z.string().nullable(),
  available_actions: z.array(z.string()).default([]),
  lines: z.array(StockAdjustmentLineSchema).optional().default([]),
  created_at: z.string(),
  updated_at: z.string(),
});
export type StockAdjustment = z.infer<typeof StockAdjustmentSchema>;

export const StockAdjustmentListSchema = z.array(StockAdjustmentSchema);

export const StockAdjustmentLineInputSchema = z.object({
  product_id: z.string().uuid(),
  unit_id: z.string().uuid().nullable().optional(),
  qty_delta: NullableDecimalStringSchema.optional(),
  qty_counted: NullableDecimalStringSchema.optional(),
  notes: z.string().nullable().optional(),
});
export type StockAdjustmentLineInput = z.infer<typeof StockAdjustmentLineInputSchema>;

export const StockAdjustmentCreateRequestSchema = z.object({
  warehouse_id: z.string().uuid(),
  document_date: z.string().nullable().optional(),
  reason: StockAdjustmentReasonSchema,
  branch_id: z.string().uuid().nullable().optional(),
  reference: z.string().max(100).nullable().optional(),
  notes: z.string().nullable().optional(),
  lines: z.array(StockAdjustmentLineInputSchema).min(1),
});
export type StockAdjustmentCreateRequest = z.infer<typeof StockAdjustmentCreateRequestSchema>;

export const StockAdjustmentUpdateRequestSchema = z.object({
  warehouse_id: z.string().uuid().nullable().optional(),
  document_date: z.string().nullable().optional(),
  reason: StockAdjustmentReasonSchema.nullable().optional(),
  branch_id: z.string().uuid().nullable().optional(),
  reference: z.string().max(100).nullable().optional(),
  notes: z.string().nullable().optional(),
  lines: z.array(StockAdjustmentLineInputSchema).min(1).nullable().optional(),
  version: z.number().int().optional(),
});
export type StockAdjustmentUpdateRequest = z.infer<typeof StockAdjustmentUpdateRequestSchema>;

export const StockAdjustmentLineFormSchema = z.object({
  product_id: z.string(),
  unit_id: z.string(),
  qty_delta: z.string(),
  qty_counted: z.string(),
  notes: z.string(),
});
export type StockAdjustmentLineFormValues = z.infer<typeof StockAdjustmentLineFormSchema>;

const NON_ZERO_DECIMAL = /^(?:[+-]?)(?:0*[1-9]\d*(?:\.\d+)?|0+\.\d*[1-9]\d*)$/;
const NON_NEGATIVE_DECIMAL = /^(?:\+?)(?:0|[1-9]\d*)(?:\.\d+)?$/;

function hasProductId(value: string): boolean {
  return Boolean(value) && value !== OPTIONAL_SELECT_NONE;
}

export function isBlankAdjustmentLine(line: StockAdjustmentLineFormValues): boolean {
  return (
    !hasProductId(line.product_id) &&
    !line.qty_delta.trim() &&
    !line.qty_counted.trim() &&
    !line.notes.trim()
  );
}

export const StockAdjustmentFormSchema = z
  .object({
    warehouse_id: z
      .string()
      .refine((value) => value !== OPTIONAL_SELECT_NONE && Boolean(value), "Select a warehouse"),
    document_date: z.string().min(1, "Enter a date"),
    reason: StockAdjustmentReasonSchema,
    branch_id: z.string(),
    reference: z.string().max(100),
    notes: z.string(),
    lines: z.array(StockAdjustmentLineFormSchema),
  })
  .superRefine((values, ctx) => {
    const filled = values.lines.filter((line) => !isBlankAdjustmentLine(line));
    if (filled.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["lines"],
        message: "Add at least one product line",
      });
    }
    values.lines.forEach((line, index) => {
      if (isBlankAdjustmentLine(line)) {
        return;
      }
      if (!hasProductId(line.product_id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["lines", index, "product_id"],
          message: "Select a product",
        });
      }
      if (values.reason === "COUNT") {
        if (!NON_NEGATIVE_DECIMAL.test(line.qty_counted.trim())) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["lines", index, "qty_counted"],
            message: "Enter the counted quantity",
          });
        }
      } else if (!NON_ZERO_DECIMAL.test(line.qty_delta.trim())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["lines", index, "qty_delta"],
          message: "Enter a quantity other than 0",
        });
      }
    });
  });
export type StockAdjustmentFormValues = z.infer<typeof StockAdjustmentFormSchema>;

export type StockAdjustmentListParams = {
  page?: number;
  page_size?: number;
  search?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
  status?: StockDocumentStatus;
  warehouse_id?: string;
  reason?: StockAdjustmentReason;
  branch_id?: string;
  product_id?: string;
  document_date_from?: string;
  document_date_to?: string;
};

export function stockAdjustmentDisplayNumber(
  document: Pick<StockAdjustment, "document_number">,
): string | null {
  const value = document.document_number.trim();
  return value ? value : null;
}
