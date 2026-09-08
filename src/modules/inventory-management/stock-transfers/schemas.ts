import { z } from "zod";

import { OPTIONAL_SELECT_NONE } from "@/config/constants";
import { DecimalStringSchema, NullableDecimalStringSchema } from "@/shared/lib/money";

export const STOCK_DOCUMENT_STATUSES = ["DRAFT", "POSTED", "CANCELLED"] as const;
export const StockDocumentStatusSchema = z.enum(STOCK_DOCUMENT_STATUSES);
export type StockDocumentStatus = z.infer<typeof StockDocumentStatusSchema>;

export const STOCK_DOCUMENT_STATUS_LABELS: Record<StockDocumentStatus, string> = {
  DRAFT: "Draft",
  POSTED: "Posted",
  CANCELLED: "Cancelled",
};

export const StockTransferLineSchema = z.object({
  id: z.string().uuid(),
  line_number: z.number().int(),
  product_id: z.string().uuid(),
  unit_id: z.string().uuid().nullable(),
  qty: DecimalStringSchema,
  qty_transferred: DecimalStringSchema,
  qty_source_before: NullableDecimalStringSchema,
  qty_dest_before: NullableDecimalStringSchema,
  notes: z.string().nullable(),
});
export type StockTransferLine = z.infer<typeof StockTransferLineSchema>;

export const StockTransferSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  document_number: z.string(),
  status: StockDocumentStatusSchema,
  version: z.number().int(),
  is_posted: z.boolean(),
  document_date: z.string(),
  from_warehouse_id: z.string().uuid(),
  to_warehouse_id: z.string().uuid(),
  branch_id: z.string().uuid().nullable(),
  reason: z.string().nullable(),
  reference: z.string().nullable(),
  notes: z.string().nullable(),
  posted_at: z.string().nullable(),
  posted_by: z.string().uuid().nullable(),
  cancelled_at: z.string().nullable(),
  cancelled_by: z.string().uuid().nullable(),
  cancel_reason: z.string().nullable(),
  available_actions: z.array(z.string()).default([]),
  lines: z.array(StockTransferLineSchema).optional().default([]),
  created_at: z.string(),
  updated_at: z.string(),
});
export type StockTransfer = z.infer<typeof StockTransferSchema>;

export const StockTransferListSchema = z.array(StockTransferSchema);

export const StockTransferLineInputSchema = z.object({
  product_id: z.string().uuid(),
  unit_id: z.string().uuid().nullable().optional(),
  qty: DecimalStringSchema,
  notes: z.string().nullable().optional(),
});
export type StockTransferLineInput = z.infer<typeof StockTransferLineInputSchema>;

export const StockTransferCreateRequestSchema = z.object({
  from_warehouse_id: z.string().uuid(),
  to_warehouse_id: z.string().uuid(),
  document_date: z.string().nullable().optional(),
  branch_id: z.string().uuid().nullable().optional(),
  reason: z.string().max(200).nullable().optional(),
  reference: z.string().max(100).nullable().optional(),
  notes: z.string().nullable().optional(),
  lines: z.array(StockTransferLineInputSchema).min(1),
});
export type StockTransferCreateRequest = z.infer<typeof StockTransferCreateRequestSchema>;

export const StockTransferUpdateRequestSchema = z.object({
  from_warehouse_id: z.string().uuid().nullable().optional(),
  to_warehouse_id: z.string().uuid().nullable().optional(),
  document_date: z.string().nullable().optional(),
  branch_id: z.string().uuid().nullable().optional(),
  reason: z.string().max(200).nullable().optional(),
  reference: z.string().max(100).nullable().optional(),
  notes: z.string().nullable().optional(),
  lines: z.array(StockTransferLineInputSchema).min(1).nullable().optional(),
  version: z.number().int().optional(),
});
export type StockTransferUpdateRequest = z.infer<typeof StockTransferUpdateRequestSchema>;

export const StockTransferLineFormSchema = z.object({
  product_id: z.string(),
  unit_id: z.string(),
  qty: z.string(),
  notes: z.string(),
});
export type StockTransferLineFormValues = z.infer<typeof StockTransferLineFormSchema>;

const POSITIVE_DECIMAL = /^(?:0*[1-9]\d*(?:\.\d+)?|0+\.\d*[1-9]\d*)$/;

function hasProductId(value: string): boolean {
  return Boolean(value) && value !== OPTIONAL_SELECT_NONE;
}

export function isBlankTransferLine(line: StockTransferLineFormValues): boolean {
  return !hasProductId(line.product_id) && !line.qty.trim() && !line.notes.trim();
}

export const StockTransferFormSchema = z
  .object({
    from_warehouse_id: z
      .string()
      .refine((value) => value !== OPTIONAL_SELECT_NONE && Boolean(value), "Select a warehouse"),
    to_warehouse_id: z
      .string()
      .refine((value) => value !== OPTIONAL_SELECT_NONE && Boolean(value), "Select a warehouse"),
    document_date: z.string().min(1, "Enter a date"),
    branch_id: z.string(),
    reason: z.string().max(200),
    reference: z.string().max(100),
    notes: z.string(),
    lines: z.array(StockTransferLineFormSchema),
  })
  .superRefine((values, ctx) => {
    if (
      values.from_warehouse_id !== OPTIONAL_SELECT_NONE &&
      values.to_warehouse_id !== OPTIONAL_SELECT_NONE &&
      values.from_warehouse_id === values.to_warehouse_id
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["to_warehouse_id"],
        message: "Destination warehouse must be different",
      });
    }
    const filled = values.lines.filter((line) => !isBlankTransferLine(line));
    if (filled.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["lines"],
        message: "Add at least one product line",
      });
    }
    values.lines.forEach((line, index) => {
      if (isBlankTransferLine(line)) {
        return;
      }
      if (!hasProductId(line.product_id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["lines", index, "product_id"],
          message: "Select a product",
        });
      }
      if (!POSITIVE_DECIMAL.test(line.qty.trim())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["lines", index, "qty"],
          message: "Enter a quantity greater than 0",
        });
      }
    });
  });
export type StockTransferFormValues = z.infer<typeof StockTransferFormSchema>;

export type StockTransferListParams = {
  page?: number;
  page_size?: number;
  search?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
  status?: StockDocumentStatus;
  from_warehouse_id?: string;
  to_warehouse_id?: string;
  branch_id?: string;
  product_id?: string;
  document_date_from?: string;
  document_date_to?: string;
};

export function stockTransferDisplayNumber(
  document: Pick<StockTransfer, "document_number">,
): string | null {
  const value = document.document_number.trim();
  return value ? value : null;
}
