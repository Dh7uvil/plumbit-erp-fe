import { z } from "zod";

import { OPTIONAL_SELECT_NONE } from "@/config/constants";
import { DecimalStringSchema } from "@/shared/lib/money";

export const LEAD_STATUSES = [
  "NEW",
  "CONTACTED",
  "QUALIFIED",
  "UNQUALIFIED",
  "CONVERTED",
  "LOST",
] as const;
export const LeadStatusSchema = z.enum(LEAD_STATUSES);
export type LeadStatus = z.infer<typeof LeadStatusSchema>;

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  QUALIFIED: "Qualified",
  UNQUALIFIED: "Unqualified",
  CONVERTED: "Converted",
  LOST: "Lost",
};

export const LEAD_STATUS_VARIANTS: Record<
  LeadStatus,
  "muted" | "info" | "success" | "destructive" | "warning"
> = {
  NEW: "info",
  CONTACTED: "muted",
  QUALIFIED: "success",
  UNQUALIFIED: "warning",
  CONVERTED: "success",
  LOST: "destructive",
};

export const LeadSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  lead_number: z.string(),
  first_name: z.string().nullable(),
  last_name: z.string().nullable(),
  company_name: z.string().nullable(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  title: z.string().nullable(),
  status: LeadStatusSchema,
  rating: z.string().nullable(),
  source_id: z.string().uuid().nullable(),
  owner_id: z.string().uuid().nullable(),
  campaign_id: z.string().uuid().nullable(),
  estimated_value: DecimalStringSchema.nullable(),
  currency_id: z.string().uuid().nullable(),
  notes: z.string().nullable(),
  version: z.number().int(),
  converted_customer_id: z.string().uuid().nullable(),
  converted_contact_id: z.string().uuid().nullable(),
  converted_opportunity_id: z.string().uuid().nullable(),
  converted_at: z.string().nullable(),
  available_actions: z.array(z.string()).default([]),
  created_at: z.string(),
  updated_at: z.string(),
  created_by: z.string().uuid().nullable().optional().default(null),
  updated_by: z.string().uuid().nullable().optional().default(null),
});
export type Lead = z.infer<typeof LeadSchema>;

export const LeadListSchema = z.array(LeadSchema);

export function leadDisplayName(
  lead: Pick<Lead, "first_name" | "last_name" | "company_name" | "lead_number">,
) {
  const parts = [lead.first_name, lead.last_name].filter(Boolean);
  if (parts.length > 0) {
    const name = parts.join(" ");
    return lead.company_name ? `${name} (${lead.company_name})` : name;
  }
  return lead.company_name ?? lead.lead_number;
}

export const LeadCreateRequestSchema = z.object({
  first_name: z.string().max(100).nullable().optional(),
  last_name: z.string().max(100).nullable().optional(),
  company_name: z.string().max(200).nullable().optional(),
  email: z.string().max(255).nullable().optional(),
  phone: z.string().max(50).nullable().optional(),
  title: z.string().max(100).nullable().optional(),
  rating: z.string().max(20).nullable().optional(),
  source_id: z.string().uuid().nullable().optional(),
  owner_id: z.string().uuid().nullable().optional(),
  campaign_id: z.string().uuid().nullable().optional(),
  estimated_value: DecimalStringSchema.nullable().optional(),
  currency_id: z.string().uuid().nullable().optional(),
  notes: z.string().max(4000).nullable().optional(),
});
export type LeadCreateRequest = z.infer<typeof LeadCreateRequestSchema>;

export const LeadUpdateRequestSchema = z.object({
  version: z.number().int().optional(),
  first_name: z.string().max(100).nullable().optional(),
  last_name: z.string().max(100).nullable().optional(),
  company_name: z.string().max(200).nullable().optional(),
  email: z.string().max(255).nullable().optional(),
  phone: z.string().max(50).nullable().optional(),
  title: z.string().max(100).nullable().optional(),
  rating: z.string().max(20).nullable().optional(),
  source_id: z.string().uuid().nullable().optional(),
  owner_id: z.string().uuid().nullable().optional(),
  campaign_id: z.string().uuid().nullable().optional(),
  estimated_value: DecimalStringSchema.nullable().optional(),
  currency_id: z.string().uuid().nullable().optional(),
  notes: z.string().max(4000).nullable().optional(),
});
export type LeadUpdateRequest = z.infer<typeof LeadUpdateRequestSchema>;

export const LeadFormSchema = z
  .object({
    first_name: z.string().max(100),
    last_name: z.string().max(100),
    company_name: z.string().max(200),
    email: z.string().max(255),
    phone: z.string().max(50),
    title: z.string().max(100),
    rating: z.string().max(20),
    source_id: z.string(),
    campaign_id: z.string(),
    notes: z.string().max(4000),
  })
  .superRefine((values, ctx) => {
    if (!values.first_name.trim() && !values.last_name.trim() && !values.company_name.trim()) {
      ctx.addIssue({
        code: "custom",
        message: "Enter a name or company",
        path: ["first_name"],
      });
    }
  });
export type LeadFormValues = z.infer<typeof LeadFormSchema>;

export const defaultLeadFormValues = (): LeadFormValues => ({
  first_name: "",
  last_name: "",
  company_name: "",
  email: "",
  phone: "",
  title: "",
  rating: "",
  source_id: OPTIONAL_SELECT_NONE,
  campaign_id: OPTIONAL_SELECT_NONE,
  notes: "",
});

export const LeadConvertContactSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().max(255).nullable().optional(),
  phone: z.string().max(50).nullable().optional(),
  is_primary: z.boolean().optional().default(true),
});

export const LeadConvertCustomerCreateSchema = z.object({
  name: z.string().min(1).max(200),
  tax_treatment: z.enum(["REGISTERED", "UNREGISTERED", "EXPORT", "GCC", "EXEMPT"]).optional(),
  currency_id: z.string().uuid().nullable().optional(),
  trn: z.string().max(50).nullable().optional(),
});

export const LeadConvertOpportunitySchema = z.object({
  create: z.boolean().optional().default(true),
  name: z.string().min(1).max(200).nullable().optional(),
  pipeline_id: z.string().uuid().nullable().optional(),
  stage_id: z.string().uuid().nullable().optional(),
  amount: DecimalStringSchema.nullable().optional(),
  currency_id: z.string().uuid().nullable().optional(),
  expected_close_date: z.string().nullable().optional(),
  owner_id: z.string().uuid().nullable().optional(),
});

export const LeadConvertRequestSchema = z
  .object({
    version: z.number().int().optional(),
    customer_id: z.string().uuid().optional(),
    new_customer: LeadConvertCustomerCreateSchema.optional(),
    contact: LeadConvertContactSchema,
    opportunity: LeadConvertOpportunitySchema.optional(),
  })
  .superRefine((values, ctx) => {
    if ((values.customer_id === undefined) === (values.new_customer === undefined)) {
      ctx.addIssue({
        code: "custom",
        message: "Choose an existing customer or enter a new one",
        path: ["customer_id"],
      });
    }
  });

export type LeadConvertRequest = z.infer<typeof LeadConvertRequestSchema>;

export const LeadConvertResponseSchema = z.object({
  lead: LeadSchema,
  customer_id: z.string().uuid(),
  contact_id: z.string().uuid(),
  opportunity_id: z.string().uuid().nullable(),
});
export type LeadConvertResponse = z.infer<typeof LeadConvertResponseSchema>;

export type LeadListParams = {
  page?: number;
  page_size?: number;
  search?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
  status?: LeadStatus;
  source_id?: string;
  owner_id?: string;
  rating?: string;
  campaign_id?: string;
};
