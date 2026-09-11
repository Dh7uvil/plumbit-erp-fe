import { z } from "zod";

import { OPTIONAL_SELECT_NONE } from "@/config/constants";
import { RelatedDocumentRefSchema } from "@/shared/components/document/schemas";
import { DecimalStringSchema, NullableDecimalStringSchema } from "@/shared/lib/money";

export const PACKAGE_STATUSES = ["DRAFT", "PACKED", "CANCELLED"] as const;
export const PackageStatusSchema = z.enum(PACKAGE_STATUSES);
export type PackageStatus = z.infer<typeof PackageStatusSchema>;

export const PACKAGE_STATUS_LABELS: Record<PackageStatus, string> = {
  DRAFT: "Draft",
  PACKED: "Packed",
  CANCELLED: "Cancelled",
};

export const PACKAGE_STATUS_VARIANTS: Record<
  PackageStatus,
  "muted" | "success" | "destructive"
> = {
  DRAFT: "muted",
  PACKED: "success",
  CANCELLED: "destructive",
};

export const PackageLineSchema = z.object({
  id: z.string().uuid(),
  line_number: z.number().int(),
  sales_order_line_id: z.string().uuid(),
  product_id: z.string().uuid().nullable(),
  quantity: DecimalStringSchema,
  unit_id: z.string().uuid().nullable(),
});
export type PackageLine = z.infer<typeof PackageLineSchema>;

export const PackageSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  document_number: z.string(),
  status: PackageStatusSchema,
  version: z.number().int(),
  sales_order_id: z.string().uuid(),
  delivery_note_id: z.string().uuid().nullable(),
  package_number: z.string().nullable(),
  length: NullableDecimalStringSchema,
  width: NullableDecimalStringSchema,
  height: NullableDecimalStringSchema,
  dimension_unit: z.string().nullable(),
  gross_weight: NullableDecimalStringSchema,
  net_weight: NullableDecimalStringSchema,
  weight_unit: z.string().nullable(),
  shipping_marks: z.string().nullable(),
  notes: z.string().nullable(),
  available_actions: z.array(z.string()).default([]),
  related_documents: z.array(RelatedDocumentRefSchema).optional().default([]),
  lines: z.array(PackageLineSchema).optional().default([]),
  created_at: z.string(),
  updated_at: z.string(),
});
export type Package = z.infer<typeof PackageSchema>;
export const PackageListSchema = z.array(PackageSchema);

export const PackageLineInputSchema = z.object({
  sales_order_line_id: z.string().uuid(),
  product_id: z.string().uuid().nullable().optional(),
  quantity: DecimalStringSchema,
  unit_id: z.string().uuid().nullable().optional(),
});
export type PackageLineInput = z.infer<typeof PackageLineInputSchema>;

export const PackageCreateRequestSchema = z.object({
  sales_order_id: z.string().uuid(),
  delivery_note_id: z.string().uuid().nullable().optional(),
  package_number: z.string().nullable().optional(),
  length: NullableDecimalStringSchema.optional(),
  width: NullableDecimalStringSchema.optional(),
  height: NullableDecimalStringSchema.optional(),
  dimension_unit: z.string().nullable().optional(),
  gross_weight: NullableDecimalStringSchema.optional(),
  net_weight: NullableDecimalStringSchema.optional(),
  weight_unit: z.string().nullable().optional(),
  shipping_marks: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  lines: z.array(PackageLineInputSchema).min(1),
});
export type PackageCreateRequest = z.infer<typeof PackageCreateRequestSchema>;

export const PackageUpdateRequestSchema = z.object({
  delivery_note_id: z.string().uuid().nullable().optional(),
  package_number: z.string().nullable().optional(),
  length: NullableDecimalStringSchema.optional(),
  width: NullableDecimalStringSchema.optional(),
  height: NullableDecimalStringSchema.optional(),
  dimension_unit: z.string().nullable().optional(),
  gross_weight: NullableDecimalStringSchema.optional(),
  net_weight: NullableDecimalStringSchema.optional(),
  weight_unit: z.string().nullable().optional(),
  shipping_marks: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  lines: z.array(PackageLineInputSchema).min(1).nullable().optional(),
  version: z.number().int().optional(),
});
export type PackageUpdateRequest = z.infer<typeof PackageUpdateRequestSchema>;

export const PackageLineFormSchema = z.object({
  sales_order_line_id: z.string(),
  product_id: z.string(),
  description: z.string(),
  quantity: z.string(),
  outstanding: z.string(),
  unit_id: z.string(),
});
export type PackageLineFormValues = z.infer<typeof PackageLineFormSchema>;

const POSITIVE_DECIMAL = /^(?:0*[1-9]\d*(?:\.\d+)?|0+\.\d*[1-9]\d*)$/;

function hasId(value: string): boolean {
  return Boolean(value) && value !== OPTIONAL_SELECT_NONE;
}

export function emptyPackageLine(): PackageLineFormValues {
  return {
    sales_order_line_id: "",
    product_id: OPTIONAL_SELECT_NONE,
    description: "",
    quantity: "",
    outstanding: "",
    unit_id: OPTIONAL_SELECT_NONE,
  };
}

export function isBlankPackageLine(line: PackageLineFormValues): boolean {
  return !line.sales_order_line_id.trim() && !line.quantity.trim();
}

export const PackageFormSchema = z
  .object({
    sales_order_id: z.string().refine((value) => hasId(value), "Select a sales order"),
    delivery_note_id: z.string(),
    package_number: z.string(),
    length: z.string(),
    width: z.string(),
    height: z.string(),
    dimension_unit: z.string(),
    gross_weight: z.string(),
    net_weight: z.string(),
    weight_unit: z.string(),
    shipping_marks: z.string(),
    notes: z.string(),
    lines: z.array(PackageLineFormSchema),
  })
  .superRefine((values, ctx) => {
    const filled = values.lines.filter((line) => !isBlankPackageLine(line));
    if (filled.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["lines"],
        message: "Add at least one packed line",
      });
    }
    values.lines.forEach((line, index) => {
      if (isBlankPackageLine(line)) {
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
export type PackageFormValues = z.infer<typeof PackageFormSchema>;

export type PackageListParams = {
  page?: number;
  page_size?: number;
  search?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
  status?: PackageStatus;
  sales_order_id?: string;
  delivery_note_id?: string;
};

export function packageDisplayNumber(document: Pick<Package, "document_number">): string | null {
  const value = document.document_number.trim();
  return value ? value : null;
}

export function parsePackageStatus(value: string | undefined): PackageStatus | undefined {
  return PACKAGE_STATUSES.includes(value as PackageStatus) ? (value as PackageStatus) : undefined;
}
