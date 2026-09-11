import { z } from "zod";

import { OPTIONAL_SELECT_NONE } from "@/config/constants";
import {
  STOCK_DOCUMENT_STATUS_LABELS,
  STOCK_DOCUMENT_STATUS_VARIANTS,
  STOCK_DOCUMENT_STATUSES,
  StockDocumentStatusSchema,
  type StockDocumentStatus,
} from "@/modules/inventory-management/stock-adjustments/schemas";
import {
  EXPENSE_CATEGORIES,
  EXPENSE_CATEGORY_LABELS,
  RelatedDocumentRefSchema,
} from "@/shared/components/document/schemas";
import { DecimalStringSchema, NullableDecimalStringSchema } from "@/shared/lib/money";

export {
  EXPENSE_CATEGORIES,
  EXPENSE_CATEGORY_LABELS,
  STOCK_DOCUMENT_STATUS_LABELS,
  STOCK_DOCUMENT_STATUS_VARIANTS,
  STOCK_DOCUMENT_STATUSES,
  StockDocumentStatusSchema,
};
export type { StockDocumentStatus };

export const LANDED_COST_ALLOCATION_METHODS = ["VALUE", "WEIGHT", "QUANTITY"] as const;
export const LandedCostAllocationMethodSchema = z.enum(LANDED_COST_ALLOCATION_METHODS);
export type LandedCostAllocationMethod = z.infer<typeof LandedCostAllocationMethodSchema>;

export const LANDED_COST_ALLOCATION_METHOD_LABELS: Record<LandedCostAllocationMethod, string> = {
  VALUE: "Value",
  WEIGHT: "Weight",
  QUANTITY: "Quantity",
};

export const ExpenseCategorySchema = z.enum(EXPENSE_CATEGORIES);

export const LandedCostChargeSchema = z.object({
  id: z.string().uuid(),
  line_number: z.number().int(),
  purchase_invoice_id: z.string().uuid(),
  purchase_invoice_line_id: z.string().uuid(),
  expense_category: ExpenseCategorySchema,
  bill_number: z.string(),
  amount: DecimalStringSchema,
});
export type LandedCostCharge = z.infer<typeof LandedCostChargeSchema>;

export const LandedCostAllocationSchema = z.object({
  id: z.string().uuid(),
  line_number: z.number().int(),
  goods_receipt_id: z.string().uuid(),
  goods_receipt_line_id: z.string().uuid(),
  allocation_base: DecimalStringSchema,
  allocated_amount: DecimalStringSchema,
  qty_remaining_at_post: NullableDecimalStringSchema.optional().default(null),
  qty_consumed_at_post: NullableDecimalStringSchema.optional().default(null),
  previous_landed_unit_cost: NullableDecimalStringSchema.optional().default(null),
});
export type LandedCostAllocation = z.infer<typeof LandedCostAllocationSchema>;

export const LandedCostSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  document_number: z.string(),
  status: StockDocumentStatusSchema,
  version: z.number().int(),
  is_posted: z.boolean(),
  document_date: z.string(),
  allocation_method: LandedCostAllocationMethodSchema,
  shipment_id: z.string().uuid().nullable(),
  branch_id: z.string().uuid().nullable(),
  journal_entry_id: z.string().uuid().nullable(),
  reversal_journal_entry_id: z.string().uuid().nullable(),
  notes: z.string().nullable(),
  total_charges: DecimalStringSchema,
  posted_at: z.string().nullable(),
  posted_by: z.string().uuid().nullable(),
  cancelled_at: z.string().nullable(),
  cancelled_by: z.string().uuid().nullable(),
  cancel_reason: z.string().nullable(),
  available_actions: z.array(z.string()).default([]),
  period_locked: z.boolean().default(false),
  related_documents: z.array(RelatedDocumentRefSchema).optional().default([]),
  charges: z.array(LandedCostChargeSchema).optional().default([]),
  allocations: z.array(LandedCostAllocationSchema).optional().default([]),
  created_at: z.string(),
  updated_at: z.string(),
});
export type LandedCost = z.infer<typeof LandedCostSchema>;
export const LandedCostListSchema = z.array(LandedCostSchema);

export const LandedCostChargeInputSchema = z.object({
  purchase_invoice_line_id: z.string().uuid(),
  amount: DecimalStringSchema.nullable().optional(),
});
export type LandedCostChargeInput = z.infer<typeof LandedCostChargeInputSchema>;

export const LandedCostAllocationInputSchema = z.object({
  goods_receipt_line_id: z.string().uuid(),
});
export type LandedCostAllocationInput = z.infer<typeof LandedCostAllocationInputSchema>;

export const LandedCostCreateRequestSchema = z.object({
  document_date: z.string().nullable().optional(),
  allocation_method: LandedCostAllocationMethodSchema.optional(),
  shipment_id: z.string().uuid().nullable().optional(),
  branch_id: z.string().uuid().nullable().optional(),
  notes: z.string().nullable().optional(),
  charges: z.array(LandedCostChargeInputSchema).min(1),
  allocations: z.array(LandedCostAllocationInputSchema).min(1),
});
export type LandedCostCreateRequest = z.infer<typeof LandedCostCreateRequestSchema>;

export const LandedCostUpdateRequestSchema = z.object({
  document_date: z.string().nullable().optional(),
  allocation_method: LandedCostAllocationMethodSchema.nullable().optional(),
  shipment_id: z.string().uuid().nullable().optional(),
  branch_id: z.string().uuid().nullable().optional(),
  notes: z.string().nullable().optional(),
  charges: z.array(LandedCostChargeInputSchema).nullable().optional(),
  allocations: z.array(LandedCostAllocationInputSchema).nullable().optional(),
  version: z.number().int().optional(),
});
export type LandedCostUpdateRequest = z.infer<typeof LandedCostUpdateRequestSchema>;

export const LandedCostCreateFromBillsSchema = z.object({
  purchase_invoice_line_ids: z.array(z.string().uuid()).min(1),
  goods_receipt_ids: z.array(z.string().uuid()).optional(),
  shipment_id: z.string().uuid().nullable().optional(),
  allocation_method: LandedCostAllocationMethodSchema.optional(),
  document_date: z.string().nullable().optional(),
  branch_id: z.string().uuid().nullable().optional(),
  notes: z.string().nullable().optional(),
});
export type LandedCostCreateFromBills = z.infer<typeof LandedCostCreateFromBillsSchema>;

export const LandedCostChargeFormSchema = z.object({
  purchase_invoice_line_id: z.string(),
  amount: z.string(),
  bill_number: z.string().optional(),
  expense_category: z.string().optional(),
});
export type LandedCostChargeFormValues = z.infer<typeof LandedCostChargeFormSchema>;

export const LandedCostAllocationFormSchema = z.object({
  goods_receipt_line_id: z.string(),
  goods_receipt_number: z.string().optional(),
  description: z.string().optional(),
});
export type LandedCostAllocationFormValues = z.infer<typeof LandedCostAllocationFormSchema>;

export const LandedCostFormSchema = z
  .object({
    document_date: z.string().min(1, "Enter a date"),
    allocation_method: LandedCostAllocationMethodSchema,
    shipment_id: z.string(),
    branch_id: z.string(),
    notes: z.string(),
    charges: z.array(LandedCostChargeFormSchema),
    allocations: z.array(LandedCostAllocationFormSchema),
  })
  .superRefine((values, ctx) => {
    const charges = values.charges.filter((line) => Boolean(line.purchase_invoice_line_id));
    if (charges.length === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["charges"],
        message: "Add at least one expense bill line",
      });
    }
    const allocations = values.allocations.filter((line) => Boolean(line.goods_receipt_line_id));
    if (allocations.length === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["allocations"],
        message: "Add at least one goods receipt line",
      });
    }
  });
export type LandedCostFormValues = z.infer<typeof LandedCostFormSchema>;

export const LandedCostEligibleLineSchema = z.object({
  goods_receipt_id: z.string().uuid(),
  goods_receipt_line_id: z.string().uuid(),
  goods_receipt_number: z.string(),
  product_id: z.string().uuid().nullable(),
  description: z.string(),
  quantity: DecimalStringSchema,
  net_weight: NullableDecimalStringSchema,
  landed_unit_cost: DecimalStringSchema,
  line_value: DecimalStringSchema,
  qty_remaining: DecimalStringSchema,
});
export type LandedCostEligibleLine = z.infer<typeof LandedCostEligibleLineSchema>;

export const LandedCostEligibleSchema = z.object({
  goods_receipt_id: z.string().uuid(),
  lines: z.array(LandedCostEligibleLineSchema).optional().default([]),
});
export type LandedCostEligible = z.infer<typeof LandedCostEligibleSchema>;

export type LandedCostListParams = {
  page?: number;
  page_size?: number;
  search?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
  status?: StockDocumentStatus;
  shipment_id?: string;
  goods_receipt_id?: string;
  purchase_invoice_id?: string;
  document_date_from?: string;
  document_date_to?: string;
};

export function landedCostDisplayNumber(document: Pick<LandedCost, "document_number">): string | null {
  const value = document.document_number.trim();
  return value ? value : null;
}

export function emptyChargeForm(): LandedCostChargeFormValues {
  return { purchase_invoice_line_id: "", amount: "" };
}

export function emptyAllocationForm(): LandedCostAllocationFormValues {
  return { goods_receipt_line_id: "" };
}

export function optionalSelect(value: string | null | undefined): string {
  return value ?? OPTIONAL_SELECT_NONE;
}
