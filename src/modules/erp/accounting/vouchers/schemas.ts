import { z } from "zod";

import { OPTIONAL_SELECT_NONE } from "@/config/constants";
import {
  INVOICE_DOCUMENT_STATUS_LABELS,
  INVOICE_DOCUMENT_STATUS_VARIANTS,
  INVOICE_DOCUMENT_STATUSES,
  InvoiceDocumentStatusSchema,
  type InvoiceDocumentStatus,
} from "@/modules/erp/sales-invoices/schemas";
import {
  PAYMENT_METHODS,
  PAYMENT_METHOD_LABELS,
  PaymentMethodSchema,
  type PaymentMethod,
} from "@/modules/erp/customer-payments/schemas";
import {
  OpenItemTypeSchema,
  PaymentAllocationInputSchema,
} from "@/shared/components/document/schemas";
import { DecimalStringSchema, MoneySchema } from "@/shared/lib/money";

export {
  INVOICE_DOCUMENT_STATUS_LABELS,
  INVOICE_DOCUMENT_STATUS_VARIANTS,
  INVOICE_DOCUMENT_STATUSES,
  PAYMENT_METHODS,
  PAYMENT_METHOD_LABELS,
};
export type { InvoiceDocumentStatus, PaymentMethod };

export const VOUCHER_ENTRY_TYPES = [
  "CASH_RECEIPT",
  "CASH_PAYMENT",
  "BANK_RECEIPT",
  "BANK_PAYMENT",
] as const;
export type VoucherEntryType = (typeof VOUCHER_ENTRY_TYPES)[number];

/** Includes legacy CONTRA values returned by the API for older records. */
export const VOUCHER_TYPES = [...VOUCHER_ENTRY_TYPES, "CONTRA"] as const;
export const VoucherTypeSchema = z.enum(VOUCHER_TYPES);
export type VoucherType = z.infer<typeof VoucherTypeSchema>;
export const VoucherEntryTypeSchema = z.enum(VOUCHER_ENTRY_TYPES);

export const VOUCHER_TYPE_LABELS: Record<VoucherType, string> = {
  CASH_RECEIPT: "Cash receipt",
  CASH_PAYMENT: "Cash payment",
  BANK_RECEIPT: "Bank receipt",
  BANK_PAYMENT: "Bank payment",
  CONTRA: "Contra",
};

/** Legacy-style entry book labels shown on the voucher entry form. */
export const VOUCHER_ENTRY_BOOK_LABELS: Record<VoucherEntryType, string> = {
  CASH_RECEIPT: "Cash Receipt",
  CASH_PAYMENT: "Cash Payment",
  BANK_RECEIPT: "Bank Receipt",
  BANK_PAYMENT: "Bank Payment",
};

export const VOUCHER_ENTRY_BOOK_OPTIONS = VOUCHER_ENTRY_TYPES.map((type) => ({
  value: type,
  label: VOUCHER_ENTRY_BOOK_LABELS[type],
}));

export const VOUCHER_WORKSPACE_TABS = [
  "cash-receipt",
  "cash-payment",
  "bank-receipt",
  "bank-payment",
  "journal",
] as const;
export type VoucherWorkspaceTab = (typeof VOUCHER_WORKSPACE_TABS)[number];

const TAB_TO_TYPE: Record<string, VoucherEntryType | undefined> = {
  "cash-receipt": "CASH_RECEIPT",
  "cash-payment": "CASH_PAYMENT",
  "bank-receipt": "BANK_RECEIPT",
  "bank-payment": "BANK_PAYMENT",
};

export function parseVoucherWorkspaceTab(value: string | null): VoucherWorkspaceTab {
  if (value === "contra") {
    return "cash-receipt";
  }
  return VOUCHER_WORKSPACE_TABS.includes(value as VoucherWorkspaceTab)
    ? (value as VoucherWorkspaceTab)
    : "cash-receipt";
}

export function voucherTypeForTab(tab: VoucherWorkspaceTab): VoucherEntryType | undefined {
  return TAB_TO_TYPE[tab];
}

const VOUCHER_TYPE_TO_TAB: Partial<Record<VoucherType, VoucherWorkspaceTab>> = {
  CASH_RECEIPT: "cash-receipt",
  CASH_PAYMENT: "cash-payment",
  BANK_RECEIPT: "bank-receipt",
  BANK_PAYMENT: "bank-payment",
};

export function vouchersListHref(voucherType?: VoucherType): string {
  if (!voucherType) {
    return "/vouchers";
  }
  const tab = VOUCHER_TYPE_TO_TAB[voucherType];
  if (!tab) {
    return "/vouchers";
  }
  return tab === "cash-receipt" ? "/vouchers" : `/vouchers?tab=${tab}`;
}

export const VoucherLineSchema = z.object({
  id: z.string().uuid(),
  line_number: z.number().int(),
  account_id: z.string().uuid(),
  amount: MoneySchema,
  party_type: z.string().nullable(),
  party_id: z.string().uuid().nullable(),
  tax_id: z.string().uuid().nullable(),
  branch_id: z.string().uuid().nullable(),
  cost_center_id: z.string().uuid().nullable(),
  description: z.string().nullable(),
});
export type VoucherLine = z.infer<typeof VoucherLineSchema>;

export const VoucherSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  document_number: z.string(),
  display_number: z.string(),
  voucher_type: VoucherTypeSchema,
  status: InvoiceDocumentStatusSchema,
  version: z.number().int(),
  is_posted: z.boolean(),
  voucher_date: z.string(),
  document_date: z.string(),
  payment_account_id: z.string().uuid(),
  counter_account_id: z.string().uuid().nullable(),
  total_amount: MoneySchema,
  amount_unapplied: MoneySchema,
  currency_id: z.string().uuid(),
  base_currency_id: z.string().uuid(),
  exchange_rate: DecimalStringSchema,
  foreign_amount: DecimalStringSchema,
  base_amount: DecimalStringSchema,
  party_type: z.string().nullable(),
  party_id: z.string().uuid().nullable(),
  payment_method: PaymentMethodSchema,
  reference: z.string().nullable(),
  branch_id: z.string().uuid().nullable(),
  cost_center_id: z.string().uuid().nullable(),
  narration: z.string().nullable(),
  journal_entry_id: z.string().uuid().nullable(),
  reversal_journal_entry_id: z.string().uuid().nullable(),
  posted_at: z.string().nullable(),
  posted_by: z.string().uuid().nullable(),
  cancelled_at: z.string().nullable(),
  cancelled_by: z.string().uuid().nullable(),
  cancel_reason: z.string().nullable(),
  lines: z.array(VoucherLineSchema).default([]),
  allocations: z.array(PaymentAllocationInputSchema).default([]),
  available_actions: z.array(z.string()).default([]),
});
export type Voucher = z.infer<typeof VoucherSchema>;

export const VoucherListSchema = z.array(VoucherSchema);

export type VoucherListParams = {
  page?: number;
  page_size?: number;
  search?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
  status?: InvoiceDocumentStatus;
  voucher_type?: VoucherType;
  party_id?: string;
  currency_id?: string;
  payment_method?: PaymentMethod;
  voucher_date_from?: string;
  voucher_date_to?: string;
};

export const VoucherLineInputSchema = z.object({
  account_id: z.string().uuid(),
  amount: DecimalStringSchema,
  party_type: z.string().nullable().optional(),
  party_id: z.string().uuid().nullable().optional(),
  tax_id: z.string().uuid().nullable().optional(),
  branch_id: z.string().uuid().nullable().optional(),
  cost_center_id: z.string().uuid().nullable().optional(),
  description: z.string().nullable().optional(),
});

export const VoucherCreateRequestSchema = z.object({
  voucher_type: VoucherTypeSchema,
  voucher_date: z.string().nullable().optional(),
  payment_account_id: z.string().uuid(),
  counter_account_id: z.string().uuid().nullable().optional(),
  total_amount: DecimalStringSchema,
  currency_id: z.string().uuid().nullable().optional(),
  party_type: z.string().nullable().optional(),
  party_id: z.string().uuid().nullable().optional(),
  payment_method: PaymentMethodSchema.optional(),
  reference: z.string().nullable().optional(),
  branch_id: z.string().uuid().nullable().optional(),
  cost_center_id: z.string().uuid().nullable().optional(),
  narration: z.string().nullable().optional(),
  lines: z.array(VoucherLineInputSchema).default([]),
  allocations: z.array(PaymentAllocationInputSchema).default([]),
});
export type VoucherCreateRequest = z.infer<typeof VoucherCreateRequestSchema>;

export const VoucherUpdateRequestSchema = VoucherCreateRequestSchema.partial().extend({
  version: z.number().int().optional(),
});
export type VoucherUpdateRequest = z.infer<typeof VoucherUpdateRequestSchema>;

export const PaymentAllocationRecordSchema = z.object({
  id: z.string().uuid(),
  payment_type: z.string(),
  payment_id: z.string().uuid(),
  item_type: OpenItemTypeSchema,
  item_id: z.string().uuid(),
  item_document_number: z.string().nullable().optional(),
  amount: MoneySchema,
  journal_entry_id: z.string().uuid().nullable().optional(),
  reversed_at: z.string().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type PaymentAllocationRecord = z.infer<typeof PaymentAllocationRecordSchema>;

export function voucherDisplayNumber(voucher: Pick<Voucher, "document_number">): string {
  return voucher.document_number;
}

export const DEFAULT_VOUCHER_LINE = {
  account_id: OPTIONAL_SELECT_NONE,
  amount: "",
  party_type: OPTIONAL_SELECT_NONE,
  party_id: OPTIONAL_SELECT_NONE,
  tax_id: OPTIONAL_SELECT_NONE,
  branch_id: OPTIONAL_SELECT_NONE,
  cost_center_id: OPTIONAL_SELECT_NONE,
  description: "",
};

export function isReceiptVoucher(voucherType: VoucherType): boolean {
  return voucherType === "CASH_RECEIPT" || voucherType === "BANK_RECEIPT";
}

export function isContraVoucher(voucherType: VoucherType): voucherType is "CONTRA" {
  return voucherType === "CONTRA";
}

export function paymentAccountSubtypeFor(voucherType: VoucherType): "CASH" | "BANK" | null {
  if (voucherType.startsWith("CASH")) {
    return "CASH";
  }
  if (voucherType.startsWith("BANK")) {
    return "BANK";
  }
  return null;
}

export const VoucherFormLineSchema = z.object({
  account_id: z.string().min(1, "Account is required"),
  amount: z.string().min(1, "Amount is required"),
  party_type: z.string(),
  party_id: z.string(),
  tax_id: z.string().optional(),
  branch_id: z.string().optional(),
  cost_center_id: z.string().optional(),
  description: z.string(),
});
export type VoucherFormLine = z.infer<typeof VoucherFormLineSchema>;

const POSITIVE_DECIMAL = /^(?:0*[1-9]\d*(?:\.\d+)?|0+\.\d*[1-9]\d*)$/;

export const VoucherFormSchema = z
  .object({
    voucher_type: VoucherTypeSchema,
    voucher_date: z.string().min(1, "Date is required"),
    payment_account_id: z.string(),
    counter_account_id: z.string(),
    total_amount: z.string().min(1, "Amount is required"),
    currency_id: z.string(),
    party_type: z.string(),
    party_id: z.string(),
    payment_method: PaymentMethodSchema,
    reference: z.string(),
    branch_id: z.string(),
    cost_center_id: z.string(),
    narration: z.string(),
    lines: z.array(VoucherFormLineSchema),
  })
  .superRefine((values, ctx) => {
    if (values.payment_account_id === OPTIONAL_SELECT_NONE || !values.payment_account_id.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Select a payment account",
        path: ["payment_account_id"],
      });
    }
    if (values.currency_id === OPTIONAL_SELECT_NONE || !values.currency_id.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Select a currency",
        path: ["currency_id"],
      });
    }
    if (!POSITIVE_DECIMAL.test(values.total_amount.trim())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Enter an amount greater than 0",
        path: ["total_amount"],
      });
    }
  });
export type VoucherFormValues = z.infer<typeof VoucherFormSchema>;

export function emptyVoucherLine(): VoucherFormLine {
  return { ...DEFAULT_VOUCHER_LINE };
}
