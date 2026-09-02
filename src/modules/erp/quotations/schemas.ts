import { z } from "zod";

import { OPTIONAL_SELECT_NONE } from "@/config/constants";
import { DecimalStringSchema, MoneySchema } from "@/shared/lib/money";

export const QUOTATION_STATUSES = [
  "DRAFT",
  "PENDING_APPROVAL",
  "APPROVED",
  "REJECTED",
  "SENT",
  "ACCEPTED",
  "DECLINED",
  "EXPIRED",
  "CANCELLED",
  "CONVERTED",
] as const;
export const QuotationStatusSchema = z.enum(QUOTATION_STATUSES);
export type QuotationStatus = z.infer<typeof QuotationStatusSchema>;

export const QUOTATION_STATUS_LABELS: Record<QuotationStatus, string> = {
  DRAFT: "Draft",
  PENDING_APPROVAL: "Pending approval",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  SENT: "Sent",
  ACCEPTED: "Accepted",
  DECLINED: "Declined",
  EXPIRED: "Expired",
  CANCELLED: "Cancelled",
  CONVERTED: "Converted",
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

export const QuotationLineSchema = z.object({
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
});
export type QuotationLine = z.infer<typeof QuotationLineSchema>;

export const QuotationSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  quote_number: z.string(),
  document_number: z.string().optional(),
  status: QuotationStatusSchema,
  version: z.number().int(),
  is_posted: z.boolean(),
  quote_date: z.string(),
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
  converted_at: z.string().nullable(),
  converted_document_type: z.string().nullable(),
  converted_document_id: z.string().uuid().nullable(),
  available_actions: z.array(z.string()).default([]),
  lines: z.array(QuotationLineSchema).optional().default([]),
  created_at: z.string(),
  updated_at: z.string(),
});
export type Quotation = z.infer<typeof QuotationSchema>;

export const QuotationListSchema = z.array(QuotationSchema);

export const QuotationComposeDefaultsSchema = z.object({
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
export type QuotationComposeDefaults = z.infer<typeof QuotationComposeDefaultsSchema>;

export const QuotationLineInputSchema = z.object({
  product_id: z.string().uuid().nullable().optional(),
  description: z.string().nullable().optional(),
  quantity: DecimalStringSchema,
  unit_id: z.string().uuid().nullable().optional(),
  rate: MoneySchema.nullable().optional(),
  discount_type: DiscountTypeSchema.nullable().optional(),
  discount_value: MoneySchema.nullable().optional(),
  tax_id: z.string().uuid().nullable().optional(),
});
export type QuotationLineInput = z.infer<typeof QuotationLineInputSchema>;

export const QuotationCreateRequestSchema = z.object({
  customer_id: z.string().uuid(),
  contact_id: z.string().uuid().nullable().optional(),
  branch_id: z.string().uuid().nullable().optional(),
  quote_date: z.string().nullable().optional(),
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
  lines: z.array(QuotationLineInputSchema).optional(),
});
export type QuotationCreateRequest = z.infer<typeof QuotationCreateRequestSchema>;

export const QuotationUpdateRequestSchema = z.object({
  contact_id: z.string().uuid().nullable().optional(),
  branch_id: z.string().uuid().nullable().optional(),
  quote_date: z.string().nullable().optional(),
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
  lines: z.array(QuotationLineInputSchema).nullable().optional(),
  version: z.number().int().optional(),
});
export type QuotationUpdateRequest = z.infer<typeof QuotationUpdateRequestSchema>;

export const QuotationLineFormSchema = z.object({
  product_id: z.string(),
  description: z.string(),
  quantity: z.string(),
  unit_id: z.string(),
  rate: z.string(),
  discount_type: z.string(),
  discount_value: z.string(),
  tax_id: z.string(),
});
export type QuotationLineFormValues = z.infer<typeof QuotationLineFormSchema>;

const POSITIVE_DECIMAL = /^(?:0*[1-9]\d*(?:\.\d+)?|0+\.\d*[1-9]\d*)$/;

function hasProductId(value: string): boolean {
  return Boolean(value) && value !== OPTIONAL_SELECT_NONE;
}

export function isBlankQuotationLine(line: QuotationLineFormValues): boolean {
  return !hasProductId(line.product_id) && !line.description.trim();
}

export const QuotationFormSchema = z
  .object({
    customer_id: z
      .string()
      .refine((value) => value !== OPTIONAL_SELECT_NONE && Boolean(value), "Select a customer"),
    contact_id: z.string(),
    branch_id: z.string(),
    quote_date: z.string(),
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
    lines: z.array(QuotationLineFormSchema),
  })
  .superRefine((values, ctx) => {
    values.lines.forEach((line, index) => {
      if (isBlankQuotationLine(line)) {
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
  });
export type QuotationFormValues = z.infer<typeof QuotationFormSchema>;

export type QuotationListParams = {
  page?: number;
  page_size?: number;
  search?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
  status?: QuotationStatus;
  customer_id?: string;
  branch_id?: string;
  currency_id?: string;
};

export function quotationDisplayNumber(
  quotation: Pick<Quotation, "quote_number"> & { document_number?: string },
): string | null {
  const value = (quotation.quote_number || quotation.document_number || "").trim();
  return value ? value : null;
}
