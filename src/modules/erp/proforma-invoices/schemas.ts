import { z } from "zod";

import { OPTIONAL_SELECT_NONE } from "@/config/constants";
import {
  ConversionLineInputSchema,
  PackingLineFormFieldsSchema,
  PackingLineInputFields,
  PackingLineResponseFields,
  RelatedDocumentRefSchema,
} from "@/shared/components/document/schemas";
import { DecimalStringSchema, MoneySchema } from "@/shared/lib/money";

export const PROFORMA_INVOICE_STATUSES = [
  "DRAFT",
  "SENT",
  "CONFIRMED",
  "DECLINED",
  "EXPIRED",
  "CANCELLED",
  "PARTIALLY_CONVERTED",
  "CONVERTED",
] as const;
export const ProformaInvoiceStatusSchema = z.enum(PROFORMA_INVOICE_STATUSES);
export type ProformaInvoiceStatus = z.infer<typeof ProformaInvoiceStatusSchema>;

export const PROFORMA_INVOICE_STATUS_LABELS: Record<ProformaInvoiceStatus, string> = {
  DRAFT: "Draft",
  SENT: "Sent",
  CONFIRMED: "Confirmed",
  DECLINED: "Declined",
  EXPIRED: "Expired",
  CANCELLED: "Cancelled",
  PARTIALLY_CONVERTED: "Partially converted",
  CONVERTED: "Converted",
};

export const PROFORMA_INVOICE_STATUS_VARIANTS: Record<
  ProformaInvoiceStatus,
  "muted" | "warning" | "info" | "success" | "destructive" | "secondary"
> = {
  DRAFT: "muted",
  SENT: "info",
  CONFIRMED: "success",
  DECLINED: "destructive",
  EXPIRED: "destructive",
  CANCELLED: "destructive",
  PARTIALLY_CONVERTED: "warning",
  CONVERTED: "secondary",
};

export const PAYMENT_MILESTONE_TRIGGERS = [
  "ON_CONFIRMATION",
  "BEFORE_SHIPMENT",
  "ON_BL_COPY",
  "ON_ARRIVAL",
  "NET_DAYS",
] as const;
export const PaymentMilestoneTriggerSchema = z.enum(PAYMENT_MILESTONE_TRIGGERS);
export type PaymentMilestoneTrigger = z.infer<typeof PaymentMilestoneTriggerSchema>;

export const PAYMENT_MILESTONE_TRIGGER_LABELS: Record<PaymentMilestoneTrigger, string> = {
  ON_CONFIRMATION: "On confirmation",
  BEFORE_SHIPMENT: "Before shipment",
  ON_BL_COPY: "On BL copy",
  ON_ARRIVAL: "On arrival",
  NET_DAYS: "Net days",
};

export const INCOTERMS = [
  "EXW",
  "FCA",
  "FAS",
  "FOB",
  "CFR",
  "CIF",
  "CPT",
  "CIP",
  "DAP",
  "DPU",
  "DDP",
] as const;
export const IncotermSchema = z.enum(INCOTERMS);
export type Incoterm = z.infer<typeof IncotermSchema>;

export const INCOTERM_LABELS: Record<Incoterm, string> = {
  EXW: "EXW — Ex Works",
  FCA: "FCA — Free Carrier",
  FAS: "FAS — Free Alongside Ship",
  FOB: "FOB — Free On Board",
  CFR: "CFR — Cost and Freight",
  CIF: "CIF — Cost, Insurance and Freight",
  CPT: "CPT — Carriage Paid To",
  CIP: "CIP — Carriage and Insurance Paid To",
  DAP: "DAP — Delivered at Place",
  DPU: "DPU — Delivered at Place Unloaded",
  DDP: "DDP — Delivered Duty Paid",
};

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
export type PlaceOfSupply = z.infer<typeof PlaceOfSupplySchema>;

export const PLACE_OF_SUPPLY_LABELS: Record<PlaceOfSupply, string> = {
  ABU_DHABI: "Abu Dhabi",
  DUBAI: "Dubai",
  SHARJAH: "Sharjah",
  AJMAN: "Ajman",
  UMM_AL_QUWAIN: "Umm Al Quwain",
  RAS_AL_KHAIMAH: "Ras Al Khaimah",
  FUJAIRAH: "Fujairah",
  OUTSIDE_UAE: "Outside UAE",
};

export const DISCOUNT_TYPES = ["PERCENTAGE", "AMOUNT"] as const;
export const DiscountTypeSchema = z.enum(DISCOUNT_TYPES);
export type DiscountType = z.infer<typeof DiscountTypeSchema>;

export const DISCOUNT_TYPE_LABELS: Record<DiscountType, string> = {
  PERCENTAGE: "Percentage",
  AMOUNT: "Amount",
};

export const TAX_TREATMENTS = ["REGISTERED", "UNREGISTERED", "EXPORT", "GCC", "EXEMPT"] as const;
export const TaxTreatmentSchema = z.enum(TAX_TREATMENTS);
export type TaxTreatment = z.infer<typeof TaxTreatmentSchema>;

export const TAX_TREATMENT_LABELS: Record<TaxTreatment, string> = {
  REGISTERED: "Registered",
  UNREGISTERED: "Unregistered",
  EXPORT: "Export",
  GCC: "GCC",
  EXEMPT: "Exempt",
};

export const MILESTONE_MODES = ["percent", "amount"] as const;
export type MilestoneMode = (typeof MILESTONE_MODES)[number];

export const ProformaInvoiceLineSchema = z.object({
  id: z.string().uuid(),
  line_number: z.number().int(),
  product_id: z.string().uuid().nullable(),
  description: z.string(),
  quantity: DecimalStringSchema,
  unit_id: z.string().uuid().nullable(),
  rate: MoneySchema,
  discount_type: DiscountTypeSchema.nullable(),
  discount_value: MoneySchema.nullable(),
  discount_amount: MoneySchema,
  tax_id: z.string().uuid().nullable(),
  tax_rate: MoneySchema,
  tax_amount: MoneySchema,
  amount: MoneySchema,
  hs_code: z.string().nullable().optional().default(null),
  source_quotation_line_id: z.string().uuid().nullable().optional().default(null),
  source_sales_order_line_id: z.string().uuid().nullable().optional().default(null),
  qty_converted: DecimalStringSchema.optional().default("0"),
  qty_remaining: DecimalStringSchema.optional(),
  ...PackingLineResponseFields,
});
export type ProformaInvoiceLine = z.infer<typeof ProformaInvoiceLineSchema>;

export const ProformaInvoiceMilestoneSchema = z.object({
  id: z.string().uuid(),
  sequence: z.number().int(),
  label: z.string(),
  trigger: PaymentMilestoneTriggerSchema,
  percent: MoneySchema.nullable(),
  amount: MoneySchema.nullable(),
  net_days: z.number().int().nullable(),
  due_date: z.string().nullable(),
  computed_amount: MoneySchema,
  notes: z.string().nullable(),
});
export type ProformaInvoiceMilestone = z.infer<typeof ProformaInvoiceMilestoneSchema>;

export const ProformaInvoiceSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  document_number: z.string(),
  display_number: z.string().optional(),
  status: ProformaInvoiceStatusSchema,
  version: z.number().int(),
  is_posted: z.boolean(),
  proforma_date: z.string(),
  document_date: z.string().optional(),
  valid_until: z.string().nullable(),
  branch_id: z.string().uuid().nullable(),
  customer_id: z.string().uuid(),
  contact_id: z.string().uuid().nullable(),
  customer_trn: z.string().nullable(),
  tax_treatment: TaxTreatmentSchema,
  place_of_supply: PlaceOfSupplySchema,
  currency_id: z.string().uuid(),
  base_currency_id: z.string().uuid(),
  exchange_rate: MoneySchema,
  price_list_id: z.string().uuid().nullable(),
  payment_terms_id: z.string().uuid().nullable(),
  salesperson_id: z.string().uuid().nullable(),
  notes: z.string().nullable(),
  terms_and_conditions: z.string().nullable(),
  bill_to_snapshot: z.string().nullable(),
  ship_to_snapshot: z.string().nullable(),
  discount_type: DiscountTypeSchema.nullable(),
  discount_value: MoneySchema.nullable(),
  discount_amount: MoneySchema,
  shipping_amount: MoneySchema,
  adjustment_amount: MoneySchema,
  subtotal: MoneySchema,
  tax_amount: MoneySchema,
  grand_total: MoneySchema,
  foreign_amount: MoneySchema,
  base_amount: MoneySchema,
  source_quotation_id: z.string().uuid().nullable().optional().default(null),
  source_sales_order_id: z.string().uuid().nullable().optional().default(null),
  incoterm: IncotermSchema.nullable().optional().default(null),
  incoterm_place: z.string().nullable().optional().default(null),
  port_of_loading: z.string().nullable().optional().default(null),
  port_of_discharge: z.string().nullable().optional().default(null),
  country_of_origin: z.string().nullable().optional().default(null),
  country_of_final_destination: z.string().nullable().optional().default(null),
  expected_shipment_date: z.string().nullable().optional().default(null),
  partial_shipment_allowed: z.boolean().optional().default(false),
  transhipment_allowed: z.boolean().optional().default(false),
  bank_details_snapshot: z.string().nullable().optional().default(null),
  sent_at: z.string().nullable().optional().default(null),
  sent_by: z.string().uuid().nullable().optional().default(null),
  confirmed_at: z.string().nullable().optional().default(null),
  confirmed_by: z.string().uuid().nullable().optional().default(null),
  declined_at: z.string().nullable().optional().default(null),
  declined_by: z.string().uuid().nullable().optional().default(null),
  decline_reason: z.string().nullable().optional().default(null),
  cancelled_at: z.string().nullable().optional().default(null),
  cancelled_by: z.string().uuid().nullable().optional().default(null),
  cancel_reason: z.string().nullable().optional().default(null),
  converted_at: z.string().nullable(),
  converted_document_type: z.string().nullable(),
  converted_document_id: z.string().uuid().nullable(),
  advance_required_amount: MoneySchema.optional().default("0"),
  advance_outstanding: MoneySchema.optional().default("0"),
  available_actions: z.array(z.string()).default([]),
  related_documents: z.array(RelatedDocumentRefSchema).optional().default([]),
  lines: z.array(ProformaInvoiceLineSchema).optional().default([]),
  milestones: z.array(ProformaInvoiceMilestoneSchema).optional().default([]),
  created_at: z.string(),
  updated_at: z.string(),
});
export type ProformaInvoice = z.infer<typeof ProformaInvoiceSchema>;

export const ProformaInvoiceListSchema = z.array(ProformaInvoiceSchema);

export const ProformaInvoiceComposeDefaultsSchema = z.object({
  customer_id: z.string().uuid(),
  customer_name: z.string(),
  customer_trn: z.string().nullable(),
  tax_treatment: TaxTreatmentSchema,
  currency_id: z.string().uuid(),
  price_list_id: z.string().uuid().nullable(),
  payment_terms_id: z.string().uuid().nullable(),
  salesperson_id: z.string().uuid().nullable(),
  contact_id: z.string().uuid().nullable(),
  place_of_supply: PlaceOfSupplySchema,
  bill_to_snapshot: z.string().nullable(),
  ship_to_snapshot: z.string().nullable(),
  terms_and_conditions: z.string().nullable(),
});
export type ProformaInvoiceComposeDefaults = z.infer<typeof ProformaInvoiceComposeDefaultsSchema>;

export const ProformaInvoiceLineInputSchema = z.object({
  product_id: z.string().uuid().nullable().optional(),
  description: z.string().nullable().optional(),
  quantity: DecimalStringSchema,
  unit_id: z.string().uuid().nullable().optional(),
  rate: MoneySchema.nullable().optional(),
  discount_type: DiscountTypeSchema.nullable().optional(),
  discount_value: MoneySchema.nullable().optional(),
  tax_id: z.string().uuid().nullable().optional(),
  hs_code: z.string().nullable().optional(),
  source_quotation_line_id: z.string().uuid().nullable().optional(),
  ...PackingLineInputFields,
});
export type ProformaInvoiceLineInput = z.infer<typeof ProformaInvoiceLineInputSchema>;

export const ProformaInvoiceMilestoneInputSchema = z.object({
  sequence: z.number().int().nullable().optional(),
  label: z.string().min(1).max(120),
  trigger: PaymentMilestoneTriggerSchema,
  percent: MoneySchema.nullable().optional(),
  amount: MoneySchema.nullable().optional(),
  net_days: z.number().int().nullable().optional(),
  due_date: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});
export type ProformaInvoiceMilestoneInput = z.infer<typeof ProformaInvoiceMilestoneInputSchema>;

export const ProformaInvoiceCreateRequestSchema = z.object({
  customer_id: z.string().uuid(),
  contact_id: z.string().uuid().nullable().optional(),
  branch_id: z.string().uuid().nullable().optional(),
  proforma_date: z.string().nullable().optional(),
  valid_until: z.string().nullable().optional(),
  currency_id: z.string().uuid().nullable().optional(),
  price_list_id: z.string().uuid().nullable().optional(),
  payment_terms_id: z.string().uuid().nullable().optional(),
  salesperson_id: z.string().uuid().nullable().optional(),
  notes: z.string().nullable().optional(),
  terms_and_conditions: z.string().nullable().optional(),
  terms_template_id: z.string().uuid().nullable().optional(),
  discount_type: DiscountTypeSchema.nullable().optional(),
  discount_value: MoneySchema.nullable().optional(),
  shipping_amount: MoneySchema.optional(),
  adjustment_amount: MoneySchema.optional(),
  place_of_supply: PlaceOfSupplySchema.nullable().optional(),
  source_quotation_id: z.string().uuid().nullable().optional(),
  incoterm: IncotermSchema.nullable().optional(),
  incoterm_place: z.string().nullable().optional(),
  port_of_loading: z.string().nullable().optional(),
  port_of_discharge: z.string().nullable().optional(),
  country_of_origin: z.string().nullable().optional(),
  country_of_final_destination: z.string().nullable().optional(),
  expected_shipment_date: z.string().nullable().optional(),
  partial_shipment_allowed: z.boolean().optional(),
  transhipment_allowed: z.boolean().optional(),
  bank_details_snapshot: z.string().nullable().optional(),
  lines: z.array(ProformaInvoiceLineInputSchema).optional(),
  milestones: z.array(ProformaInvoiceMilestoneInputSchema).optional(),
});
export type ProformaInvoiceCreateRequest = z.infer<typeof ProformaInvoiceCreateRequestSchema>;

export const ProformaInvoiceUpdateRequestSchema = z.object({
  contact_id: z.string().uuid().nullable().optional(),
  branch_id: z.string().uuid().nullable().optional(),
  proforma_date: z.string().nullable().optional(),
  valid_until: z.string().nullable().optional(),
  currency_id: z.string().uuid().nullable().optional(),
  price_list_id: z.string().uuid().nullable().optional(),
  payment_terms_id: z.string().uuid().nullable().optional(),
  salesperson_id: z.string().uuid().nullable().optional(),
  notes: z.string().nullable().optional(),
  terms_and_conditions: z.string().nullable().optional(),
  discount_type: DiscountTypeSchema.nullable().optional(),
  discount_value: MoneySchema.nullable().optional(),
  shipping_amount: MoneySchema.nullable().optional(),
  adjustment_amount: MoneySchema.nullable().optional(),
  place_of_supply: PlaceOfSupplySchema.nullable().optional(),
  incoterm: IncotermSchema.nullable().optional(),
  incoterm_place: z.string().nullable().optional(),
  port_of_loading: z.string().nullable().optional(),
  port_of_discharge: z.string().nullable().optional(),
  country_of_origin: z.string().nullable().optional(),
  country_of_final_destination: z.string().nullable().optional(),
  expected_shipment_date: z.string().nullable().optional(),
  partial_shipment_allowed: z.boolean().nullable().optional(),
  transhipment_allowed: z.boolean().nullable().optional(),
  bank_details_snapshot: z.string().nullable().optional(),
  lines: z.array(ProformaInvoiceLineInputSchema).nullable().optional(),
  milestones: z.array(ProformaInvoiceMilestoneInputSchema).nullable().optional(),
  version: z.number().int().optional(),
});
export type ProformaInvoiceUpdateRequest = z.infer<typeof ProformaInvoiceUpdateRequestSchema>;

export const ConvertProformaToSalesOrderRequestSchema = z.object({
  order_date: z.string().nullable().optional(),
  expected_shipment_date: z.string().nullable().optional(),
  customer_po_number: z.string().max(60).nullable().optional(),
  customer_po_date: z.string().nullable().optional(),
  warehouse_id: z.string().uuid().nullable().optional(),
  branch_id: z.string().uuid().nullable().optional(),
  version: z.number().int().optional(),
  lines: z.array(ConversionLineInputSchema).nullable().optional(),
});
export type ConvertProformaToSalesOrderRequest = z.infer<
  typeof ConvertProformaToSalesOrderRequestSchema
>;

export const ConvertProformaToSalesInvoiceRequestSchema = z.object({
  invoice_date: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  version: z.number().int().optional(),
  lines: z.array(ConversionLineInputSchema).nullable().optional(),
});
export type ConvertProformaToSalesInvoiceRequest = z.infer<
  typeof ConvertProformaToSalesInvoiceRequestSchema
>;

export const ProformaInvoiceLineFormSchema = z
  .object({
    product_id: z.string(),
    description: z.string(),
    quantity: z.string(),
    unit_id: z.string(),
    rate: z.string(),
    discount_type: z.string(),
    discount_value: z.string(),
    tax_id: z.string(),
    hs_code: z.string().optional(),
    source_quotation_line_id: z.string().optional(),
  })
  .merge(PackingLineFormFieldsSchema);
export type ProformaInvoiceLineFormValues = z.infer<typeof ProformaInvoiceLineFormSchema>;

export const ProformaInvoiceMilestoneFormSchema = z.object({
  sequence: z.string(),
  label: z.string(),
  trigger: z.string(),
  mode: z.enum(MILESTONE_MODES),
  value: z.string(),
  net_days: z.string(),
  due_date: z.string(),
  notes: z.string(),
});
export type ProformaInvoiceMilestoneFormValues = z.infer<typeof ProformaInvoiceMilestoneFormSchema>;

const POSITIVE_DECIMAL = /^(?:0*[1-9]\d*(?:\.\d+)?|0+\.\d*[1-9]\d*)$/;
const NON_NEGATIVE_DECIMAL = /^(?:\d+(?:\.\d+)?|\.\d+)$/;

function hasProductId(value: string): boolean {
  return Boolean(value) && value !== OPTIONAL_SELECT_NONE;
}

export function isBlankProformaInvoiceLine(line: ProformaInvoiceLineFormValues): boolean {
  return !hasProductId(line.product_id) && !line.description.trim();
}

export function parseDecimal(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed || !NON_NEGATIVE_DECIMAL.test(trimmed)) {
    return null;
  }
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

export type MilestoneTotals = {
  mixed: boolean;
  mode: MilestoneMode | null;
  percentSum: number | null;
  amountSum: number | null;
};

export function milestoneTotals(rows: ProformaInvoiceMilestoneFormValues[]): MilestoneTotals {
  const modes = new Set(rows.map((row) => row.mode));
  const mixed = modes.size > 1;
  const mode = !mixed && rows[0] ? rows[0].mode : null;
  if (mixed || !mode) {
    return { mixed, mode: null, percentSum: null, amountSum: null };
  }
  const values = rows.map((row) => parseDecimal(row.value) ?? 0);
  const sum = values.reduce((total, value) => total + value, 0);
  return {
    mixed: false,
    mode,
    percentSum: mode === "percent" ? sum : null,
    amountSum: mode === "amount" ? sum : null,
  };
}

export function defaultMilestones(): ProformaInvoiceMilestoneFormValues[] {
  return [
    {
      sequence: "1",
      label: "30% advance TT",
      trigger: "ON_CONFIRMATION",
      mode: "percent",
      value: "30",
      net_days: "",
      due_date: "",
      notes: "",
    },
    {
      sequence: "2",
      label: "70% before shipment",
      trigger: "BEFORE_SHIPMENT",
      mode: "percent",
      value: "70",
      net_days: "",
      due_date: "",
      notes: "",
    },
  ];
}

export const ProformaInvoiceFormSchema = z
  .object({
    customer_id: z
      .string()
      .refine((value) => value !== OPTIONAL_SELECT_NONE && Boolean(value), "Select a customer"),
    contact_id: z.string(),
    branch_id: z.string(),
    proforma_date: z.string(),
    valid_until: z.string(),
    currency_id: z.string(),
    price_list_id: z.string(),
    payment_terms_id: z.string(),
    salesperson_id: z.string(),
    notes: z.string(),
    terms_and_conditions: z.string(),
    terms_template_id: z.string(),
    discount_type: z.string(),
    discount_value: z.string(),
    shipping_amount: z.string(),
    adjustment_amount: z.string(),
    place_of_supply: z.string(),
    customer_trn: z.string(),
    tax_treatment: z.string(),
    bill_to_snapshot: z.string(),
    ship_to_snapshot: z.string(),
    incoterm: z.string(),
    incoterm_place: z.string(),
    port_of_loading: z.string(),
    port_of_discharge: z.string(),
    country_of_origin: z.string(),
    country_of_final_destination: z.string(),
    expected_shipment_date: z.string(),
    partial_shipment_allowed: z.boolean(),
    transhipment_allowed: z.boolean(),
    grand_total: z.string(),
    lines: z.array(ProformaInvoiceLineFormSchema),
    milestones: z.array(ProformaInvoiceMilestoneFormSchema),
  })
  .superRefine((values, ctx) => {
    values.lines.forEach((line, index) => {
      if (isBlankProformaInvoiceLine(line)) {
        return;
      }
      if (!hasProductId(line.product_id) && !line.rate.trim()) {
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

    if (values.milestones.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["milestones"],
        message: "Add at least one payment milestone",
      });
      return;
    }

    const totals = milestoneTotals(values.milestones);
    if (totals.mixed) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["milestones"],
        message: "Use percent or amount on every milestone, not both",
      });
    }
    values.milestones.forEach((row, index) => {
      if (!row.label.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["milestones", index, "label"],
          message: "Enter a label",
        });
      }
      if (!PAYMENT_MILESTONE_TRIGGERS.includes(row.trigger as PaymentMilestoneTrigger)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["milestones", index, "trigger"],
          message: "Select a trigger",
        });
      }
      if (parseDecimal(row.value) === null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["milestones", index, "value"],
          message: "Enter a value",
        });
      }
      if (row.trigger === "NET_DAYS" && !row.net_days.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["milestones", index, "net_days"],
          message: "Enter net days",
        });
      }
    });
    if (!totals.mixed && totals.mode === "percent" && totals.percentSum !== null) {
      if (Math.abs(totals.percentSum - 100) > 0.0001) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["milestones"],
          message: "Percentages must sum to 100",
        });
      }
    }
    if (!totals.mixed && totals.mode === "amount" && totals.amountSum !== null) {
      const grandTotal = parseDecimal(values.grand_total);
      if (grandTotal !== null && Math.abs(totals.amountSum - grandTotal) > 0.0001) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["milestones"],
          message: "Amounts must sum to the grand total",
        });
      }
    }
  });
export type ProformaInvoiceFormValues = z.infer<typeof ProformaInvoiceFormSchema>;

export type ProformaInvoiceListParams = {
  page?: number;
  page_size?: number;
  search?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
  status?: ProformaInvoiceStatus;
  customer_id?: string;
  source_quotation_id?: string;
  branch_id?: string;
  currency_id?: string;
};

export function proformaInvoiceDisplayNumber(
  invoice: Pick<ProformaInvoice, "document_number"> & { display_number?: string },
): string | null {
  const value = (invoice.display_number || invoice.document_number || "").trim();
  return value ? value : null;
}
