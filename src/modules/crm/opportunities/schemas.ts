import { z } from "zod";

import { OPTIONAL_SELECT_NONE } from "@/config/constants";
import { DecimalStringSchema } from "@/shared/lib/money";

export const OPPORTUNITY_STATUSES = ["OPEN", "WON", "LOST"] as const;
export const OpportunityStatusSchema = z.enum(OPPORTUNITY_STATUSES);
export type OpportunityStatus = z.infer<typeof OpportunityStatusSchema>;

export const OPPORTUNITY_STATUS_LABELS: Record<OpportunityStatus, string> = {
  OPEN: "Open",
  WON: "Won",
  LOST: "Lost",
};

export const OPPORTUNITY_STATUS_VARIANTS: Record<
  OpportunityStatus,
  "muted" | "info" | "success" | "destructive" | "warning"
> = {
  OPEN: "info",
  WON: "success",
  LOST: "destructive",
};

export const OpportunitySchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  opportunity_number: z.string(),
  name: z.string(),
  customer_id: z.string().uuid().nullable(),
  contact_id: z.string().uuid().nullable(),
  pipeline_id: z.string().uuid(),
  stage_id: z.string().uuid(),
  amount: DecimalStringSchema.nullable(),
  currency_id: z.string().uuid().nullable(),
  probability: DecimalStringSchema.nullable(),
  expected_close_date: z.string().nullable(),
  status: OpportunityStatusSchema,
  lost_reason_id: z.string().uuid().nullable(),
  owner_id: z.string().uuid().nullable(),
  source_id: z.string().uuid().nullable(),
  lead_id: z.string().uuid().nullable(),
  campaign_id: z.string().uuid().nullable(),
  version: z.number().int(),
  available_actions: z.array(z.string()).default([]),
  created_at: z.string(),
  updated_at: z.string(),
  created_by: z.string().uuid().nullable().optional().default(null),
  updated_by: z.string().uuid().nullable().optional().default(null),
});
export type Opportunity = z.infer<typeof OpportunitySchema>;

export const OpportunityListSchema = z.array(OpportunitySchema);

export const OpportunityCreateRequestSchema = z.object({
  name: z.string().min(1).max(200),
  customer_id: z.string().uuid().nullable().optional(),
  contact_id: z.string().uuid().nullable().optional(),
  pipeline_id: z.string().uuid().nullable().optional(),
  stage_id: z.string().uuid().nullable().optional(),
  amount: DecimalStringSchema.nullable().optional(),
  currency_id: z.string().uuid().nullable().optional(),
  probability: DecimalStringSchema.nullable().optional(),
  expected_close_date: z.string().nullable().optional(),
  owner_id: z.string().uuid().nullable().optional(),
  source_id: z.string().uuid().nullable().optional(),
  lead_id: z.string().uuid().nullable().optional(),
  campaign_id: z.string().uuid().nullable().optional(),
});
export type OpportunityCreateRequest = z.infer<typeof OpportunityCreateRequestSchema>;

export const OpportunityUpdateRequestSchema = z.object({
  version: z.number().int().optional(),
  name: z.string().min(1).max(200).optional(),
  customer_id: z.string().uuid().nullable().optional(),
  contact_id: z.string().uuid().nullable().optional(),
  amount: DecimalStringSchema.nullable().optional(),
  currency_id: z.string().uuid().nullable().optional(),
  probability: DecimalStringSchema.nullable().optional(),
  expected_close_date: z.string().nullable().optional(),
  owner_id: z.string().uuid().nullable().optional(),
  source_id: z.string().uuid().nullable().optional(),
  campaign_id: z.string().uuid().nullable().optional(),
});
export type OpportunityUpdateRequest = z.infer<typeof OpportunityUpdateRequestSchema>;

export const OpportunityFormSchema = z.object({
  name: z.string().min(1).max(200),
  pipeline_id: z.string(),
  stage_id: z.string(),
  amount: z.string(),
  currency_id: z.string(),
  expected_close_date: z.string(),
  source_id: z.string(),
  campaign_id: z.string(),
});
export type OpportunityFormValues = z.infer<typeof OpportunityFormSchema>;

export const defaultOpportunityFormValues = (): OpportunityFormValues => ({
  name: "",
  pipeline_id: OPTIONAL_SELECT_NONE,
  stage_id: OPTIONAL_SELECT_NONE,
  amount: "",
  currency_id: OPTIONAL_SELECT_NONE,
  expected_close_date: "",
  source_id: OPTIONAL_SELECT_NONE,
  campaign_id: OPTIONAL_SELECT_NONE,
});

export type OpportunityListParams = {
  page?: number;
  page_size?: number;
  search?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
  status?: OpportunityStatus;
  pipeline_id?: string;
  stage_id?: string;
  owner_id?: string;
  customer_id?: string;
  source_id?: string;
  campaign_id?: string;
};

export function parseMoveStageAction(action: string): string | null {
  const prefix = "move_stage:";
  return action.startsWith(prefix) ? action.slice(prefix.length) : null;
}
