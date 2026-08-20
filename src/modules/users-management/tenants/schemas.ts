import { z } from "zod";

export const TenantPublicSchema = z.object({
  tenant_id: z.string().uuid(),
  name: z.string(),
});

export type TenantPublic = z.infer<typeof TenantPublicSchema>;

export const TenantListSchema = z.array(TenantPublicSchema);

export const AddressPayloadSchema = z.object({
  address_line_1: z.string().max(250).nullable().optional(),
  address_line_2: z.string().max(250).nullable().optional(),
  city: z.string().max(100).nullable().optional(),
  state: z.string().max(100).nullable().optional(),
  country: z.string().max(100).nullable().optional(),
  country_code: z.string().max(10).nullable().optional(),
  postal_code: z.string().max(30).nullable().optional(),
});
export type AddressPayload = z.infer<typeof AddressPayloadSchema>;

export const TenantCurrentSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  code: z.string(),
  timezone: z.string(),
  status: z.string(),
  industry: z.string().nullable().optional(),
  website: z.string().nullable().optional(),
  contact_email: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  founded: z.string().nullable().optional(),
  fiscal_year_start: z.string().nullable().optional(),
  default_currency: z.string().nullable().optional(),
  headquarters: AddressPayloadSchema.nullable().optional(),
  users_count: z.number().int().nonnegative(),
  departments_count: z.number().int().nonnegative(),
  branches_count: z.number().int().nonnegative(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type TenantCurrent = z.infer<typeof TenantCurrentSchema>;

export const TenantCurrentUpdateSchema = z.object({
  name: z.string().min(1).max(200).nullable().optional(),
  timezone: z.string().min(1).max(100).nullable().optional(),
  industry: z.string().max(150).nullable().optional(),
  website: z.string().max(255).nullable().optional(),
  contact_email: z.string().max(255).nullable().optional(),
  phone: z.string().max(50).nullable().optional(),
  founded: z.string().max(20).nullable().optional(),
  fiscal_year_start: z.string().max(50).nullable().optional(),
  default_currency: z.string().max(3).nullable().optional(),
  headquarters: AddressPayloadSchema.nullable().optional(),
});
export type TenantCurrentUpdate = z.infer<typeof TenantCurrentUpdateSchema>;

export const AddressFormSchema = z.object({
  address_line_1: z.string().max(250),
  address_line_2: z.string().max(250),
  city: z.string().max(100),
  state: z.string().max(100),
  country: z.string().max(100),
  country_code: z.string().max(10),
  postal_code: z.string().max(30),
});
export type AddressFormValues = z.infer<typeof AddressFormSchema>;

export const CompanySettingsFormSchema = z.object({
  name: z.string().min(1, "Enter a company name").max(200),
  industry: z.string().max(150),
  website: z.string().max(255),
  contact_email: z.string().max(255),
  phone: z.string().max(50),
  founded: z.string().max(20),
  headquarters: AddressFormSchema,
  default_currency: z.string().max(3),
  timezone: z.string().min(1, "Enter a timezone").max(100),
  fiscal_year_start: z.string().max(50),
});
export type CompanySettingsFormValues = z.infer<typeof CompanySettingsFormSchema>;
