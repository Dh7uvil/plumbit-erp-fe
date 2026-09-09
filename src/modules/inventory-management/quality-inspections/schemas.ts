import { z } from "zod";

import { OPTIONAL_SELECT_NONE } from "@/config/constants";
import { DecimalStringSchema } from "@/shared/lib/money";

export const QUALITY_INSPECTION_STATUSES = ["DRAFT", "APPROVED", "CANCELLED"] as const;
export const QualityInspectionStatusSchema = z.enum(QUALITY_INSPECTION_STATUSES);
export type QualityInspectionStatus = z.infer<typeof QualityInspectionStatusSchema>;

export const QUALITY_INSPECTION_STATUS_LABELS: Record<QualityInspectionStatus, string> = {
  DRAFT: "Draft",
  APPROVED: "Approved",
  CANCELLED: "Cancelled",
};

export const QUALITY_INSPECTION_STATUS_VARIANTS: Record<
  QualityInspectionStatus,
  "muted" | "success" | "destructive"
> = {
  DRAFT: "muted",
  APPROVED: "success",
  CANCELLED: "destructive",
};

export const QC_DISPOSITIONS = ["RETURN_TO_SUPPLIER", "SCRAP"] as const;
export const QcDispositionSchema = z.enum(QC_DISPOSITIONS);
export type QcDisposition = z.infer<typeof QcDispositionSchema>;

export const QC_DISPOSITION_LABELS: Record<QcDisposition, string> = {
  RETURN_TO_SUPPLIER: "Return to supplier",
  SCRAP: "Scrap",
};

export const QualityInspectionLineSchema = z.object({
  id: z.string().uuid(),
  line_number: z.number().int(),
  goods_receipt_line_id: z.string().uuid(),
  qty_inspected: DecimalStringSchema,
  qty_accepted: DecimalStringSchema,
  qty_rejected: DecimalStringSchema,
  qty_rework: DecimalStringSchema,
  disposition: QcDispositionSchema.nullable(),
  notes: z.string().nullable(),
});
export type QualityInspectionLine = z.infer<typeof QualityInspectionLineSchema>;

export const QualityInspectionSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  document_number: z.string(),
  status: QualityInspectionStatusSchema,
  version: z.number().int(),
  goods_receipt_id: z.string().uuid(),
  inspection_date: z.string(),
  inspector_user_id: z.string().uuid().nullable(),
  notes: z.string().nullable(),
  approved_at: z.string().nullable(),
  approved_by: z.string().uuid().nullable(),
  cancelled_at: z.string().nullable(),
  cancelled_by: z.string().uuid().nullable(),
  cancel_reason: z.string().nullable(),
  available_actions: z.array(z.string()).default([]),
  period_locked: z.boolean().default(false),
  lines: z.array(QualityInspectionLineSchema).optional().default([]),
  created_at: z.string(),
  updated_at: z.string(),
});
export type QualityInspection = z.infer<typeof QualityInspectionSchema>;

export const QualityInspectionListSchema = z.array(QualityInspectionSchema);

export const QualityInspectionLineInputSchema = z.object({
  goods_receipt_line_id: z.string().uuid(),
  qty_inspected: DecimalStringSchema,
  qty_accepted: DecimalStringSchema.optional(),
  qty_rejected: DecimalStringSchema.optional(),
  qty_rework: DecimalStringSchema.optional(),
  disposition: QcDispositionSchema.nullable().optional(),
  notes: z.string().nullable().optional(),
});
export type QualityInspectionLineInput = z.infer<typeof QualityInspectionLineInputSchema>;

export const QualityInspectionCreateRequestSchema = z.object({
  goods_receipt_id: z.string().uuid(),
  inspection_date: z.string().nullable().optional(),
  inspector_user_id: z.string().uuid().nullable().optional(),
  notes: z.string().nullable().optional(),
  lines: z.array(QualityInspectionLineInputSchema).min(1),
});
export type QualityInspectionCreateRequest = z.infer<typeof QualityInspectionCreateRequestSchema>;

export const QualityInspectionUpdateRequestSchema = z.object({
  inspection_date: z.string().nullable().optional(),
  inspector_user_id: z.string().uuid().nullable().optional(),
  notes: z.string().nullable().optional(),
  lines: z.array(QualityInspectionLineInputSchema).min(1).nullable().optional(),
  version: z.number().int().optional(),
});
export type QualityInspectionUpdateRequest = z.infer<typeof QualityInspectionUpdateRequestSchema>;

export const QualityInspectionLineFormSchema = z.object({
  goods_receipt_line_id: z.string(),
  qty_inspected: z.string(),
  qty_accepted: z.string(),
  qty_rejected: z.string(),
  qty_rework: z.string(),
  disposition: z.string(),
  notes: z.string(),
});
export type QualityInspectionLineFormValues = z.infer<typeof QualityInspectionLineFormSchema>;

const NON_NEGATIVE_DECIMAL = /^(?:\+?)(?:0|[1-9]\d*)(?:\.\d+)?$/;

export const QualityInspectionFormSchema = z
  .object({
    goods_receipt_id: z
      .string()
      .refine((value) => value !== OPTIONAL_SELECT_NONE && Boolean(value), "Select a goods receipt"),
    inspection_date: z.string().min(1, "Enter a date"),
    inspector_user_id: z.string(),
    notes: z.string(),
    lines: z.array(QualityInspectionLineFormSchema),
  })
  .superRefine((values, ctx) => {
    if (values.lines.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["lines"],
        message: "Add at least one inspection line",
      });
    }
    values.lines.forEach((line, index) => {
      for (const field of ["qty_inspected", "qty_accepted", "qty_rejected", "qty_rework"] as const) {
        if (!NON_NEGATIVE_DECIMAL.test(line[field].trim() || "0")) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["lines", index, field],
            message: "Enter a non-negative quantity",
          });
        }
      }
      const rejected = line.qty_rejected.trim();
      if (rejected && rejected !== "0" && rejected !== "0.0" && !line.disposition) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["lines", index, "disposition"],
          message: "Select a disposition for rejected quantity",
        });
      }
    });
  });
export type QualityInspectionFormValues = z.infer<typeof QualityInspectionFormSchema>;

export type QualityInspectionListParams = {
  page?: number;
  page_size?: number;
  search?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
  status?: QualityInspectionStatus;
  goods_receipt_id?: string;
  inspection_date_from?: string;
  inspection_date_to?: string;
};

export function qualityInspectionDisplayNumber(
  document: Pick<QualityInspection, "document_number">,
): string | null {
  const value = document.document_number.trim();
  return value ? value : null;
}

export function parseQualityInspectionStatus(
  value: string | undefined,
): QualityInspectionStatus | undefined {
  return QUALITY_INSPECTION_STATUSES.includes(value as QualityInspectionStatus)
    ? (value as QualityInspectionStatus)
    : undefined;
}
