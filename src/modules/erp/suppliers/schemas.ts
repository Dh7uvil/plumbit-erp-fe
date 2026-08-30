import { z } from "zod";

import { refineInitialContact } from "@/modules/crm/contacts/schemas";
import {
  COMPANY_TYPE_LABELS,
  CompanyTypeSchema,
  TAX_TREATMENT_LABELS,
  TAX_TREATMENTS,
  TaxTreatmentSchema,
  type CompanyType,
  type TaxTreatment,
} from "@/modules/crm/customers/schemas";
import {
  AddressFormSchema,
  AddressPayloadSchema,
} from "@/modules/users-management/tenants/schemas";
import { MoneySchema } from "@/shared/lib/money";

export { COMPANY_TYPE_LABELS, TAX_TREATMENT_LABELS, TAX_TREATMENTS };
export type { CompanyType, TaxTreatment };

export const SUPPLIER_COMPANY_TYPES = ["SUPPLIER", "BOTH"] as const;
export const SupplierCompanyTypeSchema = z.enum(SUPPLIER_COMPANY_TYPES);
export type SupplierCompanyType = z.infer<typeof SupplierCompanyTypeSchema>;

export const SUPPLIER_COMPANY_TYPE_LABELS: Record<SupplierCompanyType, string> = {
  SUPPLIER: "Supplier",
  BOTH: "Both ( & Customer )",
};

export const SupplierAddressSchema = AddressPayloadSchema.extend({
  id: z.string().uuid().optional(),
});
export type SupplierAddress = z.infer<typeof SupplierAddressSchema>;

export const SupplierExtraAddressSchema = z.object({
  id: z.string().uuid(),
  label: z.string().nullable(),
  is_default_billing: z.boolean(),
  is_default_shipping: z.boolean(),
  address: SupplierAddressSchema,
});
export type SupplierExtraAddress = z.infer<typeof SupplierExtraAddressSchema>;

export const SupplierSchema = z.object({
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
  billing_address: SupplierAddressSchema.nullable().optional().default(null),
  shipping_address: SupplierAddressSchema.nullable().optional().default(null),
  extra_addresses: z.array(SupplierExtraAddressSchema).optional().default([]),
  notes: z.string().nullable(),
  is_active: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type Supplier = z.infer<typeof SupplierSchema>;

export const SupplierListSchema = z.array(SupplierSchema);

export const SupplierCreateRequestSchema = z.object({
  name: z.string().min(1).max(200),
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
export type SupplierCreateRequest = z.infer<typeof SupplierCreateRequestSchema>;

export const SupplierUpdateRequestSchema = z.object({
  name: z.string().min(1).max(200).nullable().optional(),
  company_type: CompanyTypeSchema.nullable().optional(),
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
export type SupplierUpdateRequest = z.infer<typeof SupplierUpdateRequestSchema>;

export const SupplierExtraAddressCreateRequestSchema = z.object({
  label: z.string().max(100).nullable().optional(),
  address: AddressPayloadSchema,
  is_default_billing: z.boolean().optional(),
  is_default_shipping: z.boolean().optional(),
});
export type SupplierExtraAddressCreateRequest = z.infer<
  typeof SupplierExtraAddressCreateRequestSchema
>;

export const SupplierFormSchema = z
  .object({
    name: z.string().min(1, "Enter a name").max(200),
    company_type: SupplierCompanyTypeSchema,
    trn: z.string().max(50),
    tax_treatment: TaxTreatmentSchema,
    currency_id: z.string(),
    default_price_list_id: z.string(),
    payment_terms_id: z.string(),
    credit_limit: z.string(),
    salesperson_id: z.string(),
    billing_address: AddressFormSchema,
    shipping_address: AddressFormSchema,
    same_as_billing: z.boolean(),
    notes: z.string().max(2000),
    is_active: z.boolean(),
    initial_contact_name: z.string().max(200),
    initial_contact_email: z.string().max(255),
    initial_contact_phone: z.string().max(50),
  })
  .superRefine((values, ctx) => {
    if (values.tax_treatment === "REGISTERED" && !values.trn.trim()) {
      ctx.addIssue({
        code: "custom",
        path: ["trn"],
        message: "Enter a TRN",
      });
    }
    refineInitialContact(values, ctx);
  });
export type SupplierFormValues = z.infer<typeof SupplierFormSchema>;

export const ExtraAddressFormSchema = z.object({
  label: z.string().max(100),
  address: AddressFormSchema,
  is_default_billing: z.boolean(),
  is_default_shipping: z.boolean(),
});
export type ExtraAddressFormValues = z.infer<typeof ExtraAddressFormSchema>;

export type SupplierListParams = {
  page?: number;
  page_size?: number;
  search?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
  tax_treatment?: TaxTreatment;
  currency_id?: string;
  is_active?: boolean;
};
