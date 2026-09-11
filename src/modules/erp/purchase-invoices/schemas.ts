import { z } from "zod";

import { OPTIONAL_SELECT_NONE } from "@/config/constants";
import {
  DISCOUNT_TYPE_LABELS,
  DISCOUNT_TYPES,
  DiscountTypeSchema,
  INVOICE_DOCUMENT_STATUS_LABELS,
  INVOICE_DOCUMENT_STATUS_VARIANTS,
  INVOICE_DOCUMENT_STATUSES,
  InvoiceDocumentStatusSchema,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_VARIANTS,
  PAYMENT_STATUSES,
  PaymentStatusSchema,
  PLACE_OF_SUPPLY_LABELS,
  PLACES_OF_SUPPLY,
  PlaceOfSupplySchema,
  TAX_TREATMENT_LABELS,
  TAX_TREATMENTS,
  TaxTreatmentSchema,
  type DiscountType,
  type InvoiceDocumentStatus,
  type PaymentStatus,
  type PlaceOfSupply,
} from "@/modules/erp/sales-invoices/schemas";
import {
  EXPENSE_CATEGORIES,
  EXPENSE_CATEGORY_LABELS,
  RelatedDocumentRefSchema,
  type ExpenseCategory,
} from "@/shared/components/document/schemas";
import { DecimalStringSchema, MoneySchema } from "@/shared/lib/money";

export {
  DISCOUNT_TYPE_LABELS,
  DISCOUNT_TYPES,
  EXPENSE_CATEGORIES,
  EXPENSE_CATEGORY_LABELS,
  INVOICE_DOCUMENT_STATUS_LABELS,
  INVOICE_DOCUMENT_STATUS_VARIANTS,
  INVOICE_DOCUMENT_STATUSES,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_VARIANTS,
  PAYMENT_STATUSES,
  PLACE_OF_SUPPLY_LABELS,
  PLACES_OF_SUPPLY,
  TAX_TREATMENT_LABELS,
  TAX_TREATMENTS,
};
export type {
  DiscountType,
  ExpenseCategory,
  InvoiceDocumentStatus,
  PaymentStatus,
  PlaceOfSupply,
};

export const BILL_TYPES = ["GOODS", "EXPENSE", "IMPORT"] as const;
export const BillTypeSchema = z.enum(BILL_TYPES);
export type BillType = z.infer<typeof BillTypeSchema>;

export const BILL_TYPE_LABELS: Record<BillType, string> = {
  GOODS: "Goods",
  EXPENSE: "Expense",
  IMPORT: "Import",
};

export const PURCHASE_INVOICE_LINE_TYPES = ["PRODUCT", "EXPENSE"] as const;
export const PurchaseInvoiceLineTypeSchema = z.enum(PURCHASE_INVOICE_LINE_TYPES);
export type PurchaseInvoiceLineType = z.infer<typeof PurchaseInvoiceLineTypeSchema>;

export const ExpenseCategorySchema = z.enum(EXPENSE_CATEGORIES);

export const PurchaseInvoiceLineSchema = z.object({
  id: z.string().uuid(),
  line_number: z.number().int(),
  line_type: PurchaseInvoiceLineTypeSchema,
  product_id: z.string().uuid().nullable(),
  description: z.string(),
  quantity: DecimalStringSchema,
  unit_id: z.string().uuid().nullable(),
  rate: MoneySchema,
  purchase_order_line_id: z.string().uuid().nullable(),
  goods_receipt_id: z.string().uuid().nullable(),
  goods_receipt_line_id: z.string().uuid().nullable(),
  supplier_product_id: z.string().uuid().nullable(),
  supplier_sku: z.string().nullable(),
  expense_account_id: z.string().uuid().nullable(),
  expense_category: ExpenseCategorySchema.nullable(),
  discount_type: DiscountTypeSchema.nullable(),
  discount_value: MoneySchema.nullable(),
  discount_amount: MoneySchema,
  tax_id: z.string().uuid().nullable(),
  tax_rate: MoneySchema,
  tax_amount: MoneySchema,
  amount: MoneySchema,
  purchase_account_id: z.string().uuid().nullable(),
  grn_unit_cost: MoneySchema,
  qty_debited: DecimalStringSchema,
});
export type PurchaseInvoiceLine = z.infer<typeof PurchaseInvoiceLineSchema>;

export const PurchaseInvoiceSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  document_number: z.string(),
  display_number: z.string().optional(),
  status: InvoiceDocumentStatusSchema,
  version: z.number().int(),
  is_posted: z.boolean(),
  invoice_date: z.string(),
  document_date: z.string(),
  bill_type: BillTypeSchema,
  supplier_id: z.string().uuid(),
  contact_id: z.string().uuid().nullable(),
  supplier_trn: z.string().nullable(),
  branch_id: z.string().uuid().nullable(),
  purchase_order_id: z.string().uuid().nullable(),
  goods_receipt_id: z.string().uuid().nullable(),
  supplier_invoice_number: z.string().nullable(),
  supplier_invoice_date: z.string().nullable(),
  payment_terms_id: z.string().uuid().nullable(),
  due_date: z.string().nullable(),
  tax_treatment: TaxTreatmentSchema,
  place_of_supply: PlaceOfSupplySchema,
  is_reverse_charge: z.boolean(),
  rcm_taxable_amount: MoneySchema,
  rcm_tax_amount: MoneySchema,
  currency_id: z.string().uuid(),
  base_currency_id: z.string().uuid(),
  exchange_rate: MoneySchema,
  discount_type: DiscountTypeSchema.nullable(),
  discount_value: MoneySchema.nullable(),
  discount_amount: MoneySchema,
  shipping_amount: MoneySchema,
  adjustment_amount: MoneySchema,
  round_off_amount: MoneySchema,
  subtotal: MoneySchema,
  tax_amount: MoneySchema,
  grand_total: MoneySchema,
  foreign_amount: MoneySchema,
  base_amount: MoneySchema,
  notes: z.string().nullable(),
  amount_paid: MoneySchema,
  amount_debited: MoneySchema,
  balance_due: MoneySchema,
  payment_status: PaymentStatusSchema,
  journal_entry_id: z.string().uuid().nullable(),
  reversal_journal_entry_id: z.string().uuid().nullable(),
  posted_at: z.string().nullable(),
  posted_by: z.string().uuid().nullable(),
  cancelled_at: z.string().nullable(),
  cancelled_by: z.string().uuid().nullable(),
  cancel_reason: z.string().nullable(),
  is_overdue: z.boolean().optional().default(false),
  is_partially_debited: z.boolean().optional().default(false),
  is_fully_debited: z.boolean().optional().default(false),
  available_actions: z.array(z.string()).default([]),
  related_documents: z.array(RelatedDocumentRefSchema).optional().default([]),
  lines: z.array(PurchaseInvoiceLineSchema).optional().default([]),
  created_at: z.string(),
  updated_at: z.string(),
});
export type PurchaseInvoice = z.infer<typeof PurchaseInvoiceSchema>;
export const PurchaseInvoiceListSchema = z.array(PurchaseInvoiceSchema);

export const PurchaseInvoiceLineInputSchema = z.object({
  line_type: PurchaseInvoiceLineTypeSchema.optional(),
  product_id: z.string().uuid().nullable().optional(),
  description: z.string().nullable().optional(),
  quantity: DecimalStringSchema.optional(),
  unit_id: z.string().uuid().nullable().optional(),
  rate: MoneySchema.nullable().optional(),
  purchase_order_line_id: z.string().uuid().nullable().optional(),
  goods_receipt_id: z.string().uuid().nullable().optional(),
  goods_receipt_line_id: z.string().uuid().nullable().optional(),
  supplier_product_id: z.string().uuid().nullable().optional(),
  supplier_sku: z.string().nullable().optional(),
  expense_account_id: z.string().uuid().nullable().optional(),
  expense_category: ExpenseCategorySchema.nullable().optional(),
  discount_type: DiscountTypeSchema.nullable().optional(),
  discount_value: MoneySchema.nullable().optional(),
  tax_id: z.string().uuid().nullable().optional(),
});
export type PurchaseInvoiceLineInput = z.infer<typeof PurchaseInvoiceLineInputSchema>;

export const PurchaseInvoiceCreateRequestSchema = z.object({
  supplier_id: z.string().uuid(),
  bill_type: BillTypeSchema.optional(),
  contact_id: z.string().uuid().nullable().optional(),
  branch_id: z.string().uuid().nullable().optional(),
  invoice_date: z.string().nullable().optional(),
  purchase_order_id: z.string().uuid().nullable().optional(),
  goods_receipt_id: z.string().uuid().nullable().optional(),
  supplier_invoice_number: z.string().nullable().optional(),
  supplier_invoice_date: z.string().nullable().optional(),
  payment_terms_id: z.string().uuid().nullable().optional(),
  currency_id: z.string().uuid().nullable().optional(),
  notes: z.string().nullable().optional(),
  discount_type: DiscountTypeSchema.nullable().optional(),
  discount_value: MoneySchema.nullable().optional(),
  shipping_amount: MoneySchema.optional(),
  adjustment_amount: MoneySchema.optional(),
  round_off_amount: MoneySchema.optional(),
  place_of_supply: PlaceOfSupplySchema.nullable().optional(),
  is_reverse_charge: z.boolean().optional(),
  lines: z.array(PurchaseInvoiceLineInputSchema),
});
export type PurchaseInvoiceCreateRequest = z.infer<typeof PurchaseInvoiceCreateRequestSchema>;

export const PurchaseInvoiceUpdateRequestSchema = z.object({
  bill_type: BillTypeSchema.nullable().optional(),
  contact_id: z.string().uuid().nullable().optional(),
  branch_id: z.string().uuid().nullable().optional(),
  invoice_date: z.string().nullable().optional(),
  purchase_order_id: z.string().uuid().nullable().optional(),
  goods_receipt_id: z.string().uuid().nullable().optional(),
  supplier_invoice_number: z.string().nullable().optional(),
  supplier_invoice_date: z.string().nullable().optional(),
  payment_terms_id: z.string().uuid().nullable().optional(),
  currency_id: z.string().uuid().nullable().optional(),
  notes: z.string().nullable().optional(),
  discount_type: DiscountTypeSchema.nullable().optional(),
  discount_value: MoneySchema.nullable().optional(),
  shipping_amount: MoneySchema.nullable().optional(),
  adjustment_amount: MoneySchema.nullable().optional(),
  round_off_amount: MoneySchema.nullable().optional(),
  place_of_supply: PlaceOfSupplySchema.nullable().optional(),
  is_reverse_charge: z.boolean().nullable().optional(),
  lines: z.array(PurchaseInvoiceLineInputSchema).nullable().optional(),
  version: z.number().int().optional(),
});
export type PurchaseInvoiceUpdateRequest = z.infer<typeof PurchaseInvoiceUpdateRequestSchema>;

export const PurchaseInvoiceCreateFromPurchaseOrderSchema = z.object({
  purchase_order_id: z.string().uuid(),
  invoice_date: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});
export type PurchaseInvoiceCreateFromPurchaseOrder = z.infer<
  typeof PurchaseInvoiceCreateFromPurchaseOrderSchema
>;

export const PurchaseInvoiceCreateFromGoodsReceiptSchema = z.object({
  goods_receipt_id: z.string().uuid(),
  invoice_date: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});
export type PurchaseInvoiceCreateFromGoodsReceipt = z.infer<
  typeof PurchaseInvoiceCreateFromGoodsReceiptSchema
>;

export const PurchaseInvoiceLineFormSchema = z.object({
  line_type: z.string().optional(),
  product_id: z.string(),
  supplier_product_id: z.string().optional(),
  supplier_sku: z.string().optional(),
  description: z.string(),
  quantity: z.string(),
  unit_id: z.string(),
  rate: z.string(),
  discount_type: z.string(),
  discount_value: z.string(),
  tax_id: z.string(),
  purchase_order_line_id: z.string().optional(),
  goods_receipt_id: z.string().optional(),
  goods_receipt_line_id: z.string().optional(),
  expense_account_id: z.string().optional(),
  expense_category: z.string().optional(),
  grn_unit_cost: z.string().optional(),
});
export type PurchaseInvoiceLineFormValues = z.infer<typeof PurchaseInvoiceLineFormSchema>;

const POSITIVE_DECIMAL = /^(?:0*[1-9]\d*(?:\.\d+)?|0+\.\d*[1-9]\d*)$/;

function hasId(value: string): boolean {
  return Boolean(value) && value !== OPTIONAL_SELECT_NONE;
}

export function isBlankPurchaseInvoiceLine(line: PurchaseInvoiceLineFormValues): boolean {
  if (line.line_type === "EXPENSE") {
    return !hasId(line.expense_account_id ?? "") && !line.description.trim() && !line.rate.trim();
  }
  return !hasId(line.product_id) && !line.description.trim();
}

export const PurchaseInvoiceFormSchema = z
  .object({
    supplier_id: z
      .string()
      .refine((value) => value !== OPTIONAL_SELECT_NONE && Boolean(value), "Select a supplier"),
    bill_type: BillTypeSchema,
    contact_id: z.string(),
    branch_id: z.string(),
    invoice_date: z.string(),
    purchase_order_id: z.string(),
    goods_receipt_id: z.string(),
    supplier_invoice_number: z.string(),
    supplier_invoice_date: z.string(),
    payment_terms_id: z.string(),
    currency_id: z.string(),
    notes: z.string(),
    discount_type: z.string(),
    discount_value: z.string(),
    shipping_amount: z.string(),
    adjustment_amount: z.string(),
    round_off_amount: z.string(),
    place_of_supply: z.string(),
    is_reverse_charge: z.boolean(),
    supplier_trn: z.string(),
    tax_treatment: z.string(),
    lines: z.array(PurchaseInvoiceLineFormSchema),
  })
  .superRefine((values, ctx) => {
    values.lines.forEach((line, index) => {
      if (isBlankPurchaseInvoiceLine(line)) {
        return;
      }
      if (values.bill_type === "EXPENSE" || line.line_type === "EXPENSE") {
        if (!hasId(line.expense_account_id ?? "")) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["lines", index, "expense_account_id"],
            message: "Select an account",
          });
        }
        if (!line.rate.trim()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["lines", index, "rate"],
            message: "Enter an amount",
          });
        }
        return;
      }
      if (!hasId(line.product_id) && !line.rate.trim()) {
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
export type PurchaseInvoiceFormValues = z.infer<typeof PurchaseInvoiceFormSchema>;

export type PurchaseInvoiceListParams = {
  page?: number;
  page_size?: number;
  search?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
  status?: InvoiceDocumentStatus;
  supplier_id?: string;
  purchase_order_id?: string;
  goods_receipt_id?: string;
  bill_type?: BillType;
  payment_status?: PaymentStatus;
  invoice_date_from?: string;
  invoice_date_to?: string;
};

export function purchaseInvoiceDisplayNumber(
  invoice: Pick<PurchaseInvoice, "document_number" | "display_number">,
): string | null {
  const display = (invoice.display_number || "").trim();
  if (display) {
    return display;
  }
  const value = (invoice.document_number || "").trim();
  return value ? value : null;
}

export function isPurchaseInvoiceOverdue(invoice: PurchaseInvoice, today: string): boolean {
  if (invoice.is_overdue) {
    return true;
  }
  if (invoice.status !== "POSTED" || invoice.payment_status === "PAID" || !invoice.due_date) {
    return false;
  }
  return invoice.due_date < today;
}

export function lineHasPurchasePriceVariance(line: PurchaseInvoiceLine): boolean {
  if (line.line_type !== "PRODUCT" || !line.grn_unit_cost.trim() || !line.rate.trim()) {
    return false;
  }
  const grn = Number(line.grn_unit_cost);
  const rate = Number(line.rate);
  if (!Number.isFinite(grn) || !Number.isFinite(rate)) {
    return false;
  }
  return grn !== rate;
}
