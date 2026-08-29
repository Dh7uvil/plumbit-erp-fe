import { z } from "zod";

import {
  AddressFormSchema,
  AddressPayloadSchema,
} from "@/modules/users-management/tenants/schemas";
import { MoneySchema } from "@/shared/lib/money";

export const COMPANY_TYPES = ["CUSTOMER", "SUPPLIER", "BOTH", "OTHER"] as const;
export const CompanyTypeSchema = z.enum(COMPANY_TYPES);
export type CompanyType = z.infer<typeof CompanyTypeSchema>;

export const COMPANY_TYPE_LABELS: Record<CompanyType, string> = {
  CUSTOMER: "Customer",
  SUPPLIER: "Supplier",
  BOTH: "Both",
  OTHER: "Other",
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

export const CustomerAddressSchema = AddressPayloadSchema.extend({
  id: z.string().uuid().optional(),
});
export type CustomerAddress = z.infer<typeof CustomerAddressSchema>;

export const CustomerExtraAddressSchema = z.object({
  id: z.string().uuid(),
  label: z.string().nullable(),
  is_default_billing: z.boolean(),
  is_default_shipping: z.boolean(),
  address: CustomerAddressSchema,
});
export type CustomerExtraAddress = z.infer<typeof CustomerExtraAddressSchema>;

export const CustomerSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  name: z.string(),
  code: z.string(),
  company_type: CompanyTypeSchema,
  trn: z.string().nullable(),
  tax_treatment: TaxTreatmentSchema,
  currency_id: z.string().uuid(),
  default_price_list_id: z.string().uuid().nullable(),
  payment_terms_id: z.string().uuid().nullable(),
  credit_limit: MoneySchema.nullable(),
  salesperson_id: z.string().uuid().nullable(),
  billing_address: CustomerAddressSchema.nullable().optional().default(null),
  shipping_address: CustomerAddressSchema.nullable().optional().default(null),
  extra_addresses: z.array(CustomerExtraAddressSchema).optional().default([]),
  notes: z.string().nullable(),
  is_active: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type Customer = z.infer<typeof CustomerSchema>;

export const CustomerListSchema = z.array(CustomerSchema);

export const CustomerCreateRequestSchema = z.object({
  name: z.string().min(1).max(200),
  code: z.string().min(1).max(50),
  company_type: CompanyTypeSchema.optional(),
  trn: z.string().max(50).nullable().optional(),
  tax_treatment: TaxTreatmentSchema,
  currency_id: z.string().uuid().nullable().optional(),
  default_price_list_id: z.string().uuid().nullable().optional(),
  payment_terms_id: z.string().uuid().nullable().optional(),
  credit_limit: MoneySchema.nullable().optional(),
  salesperson_id: z.string().uuid().nullable().optional(),
  billing_address: AddressPayloadSchema.nullable().optional(),
  shipping_address: AddressPayloadSchema.nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
});
export type CustomerCreateRequest = z.infer<typeof CustomerCreateRequestSchema>;

export const CustomerUpdateRequestSchema = z.object({
  name: z.string().min(1).max(200).nullable().optional(),
  trn: z.string().max(50).nullable().optional(),
  tax_treatment: TaxTreatmentSchema.nullable().optional(),
  currency_id: z.string().uuid().nullable().optional(),
  default_price_list_id: z.string().uuid().nullable().optional(),
  payment_terms_id: z.string().uuid().nullable().optional(),
  credit_limit: MoneySchema.nullable().optional(),
  salesperson_id: z.string().uuid().nullable().optional(),
  billing_address: AddressPayloadSchema.nullable().optional(),
  shipping_address: AddressPayloadSchema.nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
  is_active: z.boolean().nullable().optional(),
});
export type CustomerUpdateRequest = z.infer<typeof CustomerUpdateRequestSchema>;

export const CustomerExtraAddressCreateRequestSchema = z.object({
  label: z.string().max(100).nullable().optional(),
  address: AddressPayloadSchema,
  is_default_billing: z.boolean().optional(),
  is_default_shipping: z.boolean().optional(),
});
export type CustomerExtraAddressCreateRequest = z.infer<
  typeof CustomerExtraAddressCreateRequestSchema
>;

export const CustomerFormSchema = z
  .object({
    name: z.string().min(1, "Enter a name").max(200),
    code: z.string().min(1, "Enter a code").max(50),
    company_type: CompanyTypeSchema,
    trn: z.string().max(50),
    tax_treatment: TaxTreatmentSchema,
    currency_id: z.string(),
    default_price_list_id: z.string(),
    payment_terms_id: z.string(),
    credit_limit: z.string(),
    salesperson_id: z.string(),
    billing_address: AddressFormSchema,
    shipping_address: AddressFormSchema,
    notes: z.string().max(2000),
    is_active: z.boolean(),
  })
  .superRefine((values, ctx) => {
    if (values.tax_treatment === "REGISTERED" && !values.trn.trim()) {
      ctx.addIssue({
        code: "custom",
        path: ["trn"],
        message: "Enter a TRN",
      });
    }
  });
export type CustomerFormValues = z.infer<typeof CustomerFormSchema>;

export const ExtraAddressFormSchema = z.object({
  label: z.string().max(100),
  address: AddressFormSchema,
  is_default_billing: z.boolean(),
  is_default_shipping: z.boolean(),
});
export type ExtraAddressFormValues = z.infer<typeof ExtraAddressFormSchema>;

export type CustomerListParams = {
  page?: number;
  page_size?: number;
  search?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
  tax_treatment?: TaxTreatment;
  currency_id?: string;
  company_type?: CompanyType;
  is_active?: boolean;
};
