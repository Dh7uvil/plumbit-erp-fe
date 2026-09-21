import { z } from "zod";

import { DecimalStringSchema } from "@/shared/lib/money";

export const CAMPAIGN_TYPES = [
  "EMAIL",
  "WEBINAR",
  "TRADE_SHOW",
  "ADVERTISEMENT",
  "SOCIAL",
  "REFERRAL",
  "OTHER",
] as const;
export const CampaignTypeSchema = z.enum(CAMPAIGN_TYPES);
export type CampaignType = z.infer<typeof CampaignTypeSchema>;

export const CAMPAIGN_TYPE_LABELS: Record<CampaignType, string> = {
  EMAIL: "Email",
  WEBINAR: "Webinar",
  TRADE_SHOW: "Trade show",
  ADVERTISEMENT: "Advertisement",
  SOCIAL: "Social",
  REFERRAL: "Referral",
  OTHER: "Other",
};

export const CAMPAIGN_STATUSES = ["PLANNED", "ACTIVE", "COMPLETED", "CANCELLED"] as const;
export const CampaignStatusSchema = z.enum(CAMPAIGN_STATUSES);
export type CampaignStatus = z.infer<typeof CampaignStatusSchema>;

export const CAMPAIGN_STATUS_LABELS: Record<CampaignStatus, string> = {
  PLANNED: "Planned",
  ACTIVE: "Active",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export const CAMPAIGN_STATUS_VARIANTS: Record<
  CampaignStatus,
  "muted" | "info" | "success" | "destructive" | "warning"
> = {
  PLANNED: "muted",
  ACTIVE: "info",
  COMPLETED: "success",
  CANCELLED: "destructive",
};

export const CAMPAIGN_MEMBER_TYPES = ["lead", "contact"] as const;
export const CampaignMemberTypeSchema = z.enum(CAMPAIGN_MEMBER_TYPES);
export type CampaignMemberType = z.infer<typeof CampaignMemberTypeSchema>;

export const CAMPAIGN_MEMBER_TYPE_LABELS: Record<CampaignMemberType, string> = {
  lead: "Lead",
  contact: "Contact",
};

export const CAMPAIGN_MEMBER_STATUSES = ["PLANNED", "SENT", "RESPONDED", "CONVERTED"] as const;
export const CampaignMemberStatusSchema = z.enum(CAMPAIGN_MEMBER_STATUSES);
export type CampaignMemberStatus = z.infer<typeof CampaignMemberStatusSchema>;

export const CAMPAIGN_MEMBER_STATUS_LABELS: Record<CampaignMemberStatus, string> = {
  PLANNED: "Planned",
  SENT: "Sent",
  RESPONDED: "Responded",
  CONVERTED: "Converted",
};

export const CampaignSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  name: z.string(),
  campaign_type: CampaignTypeSchema,
  status: CampaignStatusSchema,
  start_date: z.string().nullable(),
  end_date: z.string().nullable(),
  budgeted_cost: DecimalStringSchema.nullable(),
  actual_cost: DecimalStringSchema.nullable(),
  expected_revenue: DecimalStringSchema.nullable(),
  owner_id: z.string().uuid().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
  created_by: z.string().uuid().nullable().optional().default(null),
  updated_by: z.string().uuid().nullable().optional().default(null),
});
export type Campaign = z.infer<typeof CampaignSchema>;

export const CampaignListSchema = z.array(CampaignSchema);

export const CampaignCreateRequestSchema = z.object({
  name: z.string().min(1).max(200),
  campaign_type: CampaignTypeSchema,
  status: CampaignStatusSchema.optional(),
  start_date: z.string().nullable().optional(),
  end_date: z.string().nullable().optional(),
  budgeted_cost: DecimalStringSchema.nullable().optional(),
  actual_cost: DecimalStringSchema.nullable().optional(),
  expected_revenue: DecimalStringSchema.nullable().optional(),
  owner_id: z.string().uuid().nullable().optional(),
});
export type CampaignCreateRequest = z.infer<typeof CampaignCreateRequestSchema>;

export const CampaignUpdateRequestSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  campaign_type: CampaignTypeSchema.optional(),
  status: CampaignStatusSchema.optional(),
  start_date: z.string().nullable().optional(),
  end_date: z.string().nullable().optional(),
  budgeted_cost: DecimalStringSchema.nullable().optional(),
  actual_cost: DecimalStringSchema.nullable().optional(),
  expected_revenue: DecimalStringSchema.nullable().optional(),
  owner_id: z.string().uuid().nullable().optional(),
});
export type CampaignUpdateRequest = z.infer<typeof CampaignUpdateRequestSchema>;

export const CampaignFormSchema = z
  .object({
    name: z.string().min(1, "Enter a name").max(200),
    campaign_type: z.string(),
    status: z.string(),
    start_date: z.string(),
    end_date: z.string(),
    budgeted_cost: z.string(),
    actual_cost: z.string(),
    expected_revenue: z.string(),
  })
  .superRefine((values, ctx) => {
    if (!CAMPAIGN_TYPES.includes(values.campaign_type as CampaignType)) {
      ctx.addIssue({ code: "custom", message: "Select a type", path: ["campaign_type"] });
    }
    if (!CAMPAIGN_STATUSES.includes(values.status as CampaignStatus)) {
      ctx.addIssue({ code: "custom", message: "Select a status", path: ["status"] });
    }
    if (values.start_date && values.end_date && values.end_date < values.start_date) {
      ctx.addIssue({
        code: "custom",
        message: "End date must be on or after the start date",
        path: ["end_date"],
      });
    }
  });
export type CampaignFormValues = z.infer<typeof CampaignFormSchema>;

export const defaultCampaignFormValues = (): CampaignFormValues => ({
  name: "",
  campaign_type: "EMAIL",
  status: "PLANNED",
  start_date: "",
  end_date: "",
  budgeted_cost: "",
  actual_cost: "",
  expected_revenue: "",
});

export const CampaignMemberSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  campaign_id: z.string().uuid(),
  member_type: CampaignMemberTypeSchema,
  member_id: z.string().uuid(),
  member_status: CampaignMemberStatusSchema,
  member_label: z.string().nullable().optional().default(null),
  created_at: z.string(),
  updated_at: z.string(),
});
export type CampaignMember = z.infer<typeof CampaignMemberSchema>;

export const CampaignMemberListSchema = z.array(CampaignMemberSchema);

export const CampaignMemberCreateRequestSchema = z.object({
  member_type: CampaignMemberTypeSchema,
  member_id: z.string().uuid(),
  member_status: CampaignMemberStatusSchema.optional(),
});
export type CampaignMemberCreateRequest = z.infer<typeof CampaignMemberCreateRequestSchema>;

export const CampaignMemberUpdateRequestSchema = z.object({
  member_status: CampaignMemberStatusSchema,
});
export type CampaignMemberUpdateRequest = z.infer<typeof CampaignMemberUpdateRequestSchema>;

export const CampaignRoiSchema = z.object({
  campaign_id: z.string().uuid(),
  member_count: z.number().int(),
  converted_leads: z.number().int(),
  won_opportunity_count: z.number().int(),
  won_opportunity_value: DecimalStringSchema,
  budgeted_cost: DecimalStringSchema.nullable(),
  actual_cost: DecimalStringSchema.nullable(),
  expected_revenue: DecimalStringSchema.nullable(),
  roi: DecimalStringSchema.nullable(),
});
export type CampaignRoi = z.infer<typeof CampaignRoiSchema>;

export type CampaignListParams = {
  page?: number;
  page_size?: number;
  search?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
  status?: CampaignStatus;
  campaign_type?: CampaignType;
  owner_id?: string;
};

export const CAMPAIGN_TABS = ["details", "members", "roi"] as const;
export type CampaignTab = (typeof CAMPAIGN_TABS)[number];

export function parseCampaignTab(value: string | null | undefined): CampaignTab {
  return CAMPAIGN_TABS.includes(value as CampaignTab) ? (value as CampaignTab) : "details";
}
