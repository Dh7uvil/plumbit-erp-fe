import { z } from "zod";

import { DecimalStringSchema, NullableDecimalStringSchema } from "@/shared/lib/money";

export const CrmReportRangeParamsSchema = z.object({
  from: z.string(),
  to: z.string(),
  group_by: z.string().optional(),
});
export type CrmReportRangeParams = z.infer<typeof CrmReportRangeParamsSchema>;

export type SalesPipelineParams = {
  group_by?: string;
  pipeline_id?: string;
};

export type SalesFunnelParams = {
  pipeline_id?: string;
};

export const SalesPipelineLineSchema = z.object({
  group_key: z.string(),
  group_label: z.string(),
  opportunity_count: z.number().int(),
  amount: DecimalStringSchema,
  weighted_amount: DecimalStringSchema,
});
export type SalesPipelineLine = z.infer<typeof SalesPipelineLineSchema>;

export const SalesPipelineSchema = z.object({
  currency_code: z.string().nullable().optional().default(null),
  group_by: z.string(),
  pipeline_id: z.string().uuid().nullable().optional().default(null),
  opportunity_count: z.number().int(),
  total_amount: DecimalStringSchema,
  total_weighted_amount: DecimalStringSchema,
  truncated: z.boolean().optional().default(false),
  lines: z.array(SalesPipelineLineSchema).default([]),
});
export type SalesPipeline = z.infer<typeof SalesPipelineSchema>;

export const SalesFunnelLineSchema = z.object({
  stage_id: z.string().uuid(),
  stage_name: z.string(),
  sort_order: z.number().int(),
  stage_kind: z.string(),
  opportunity_count: z.number().int(),
  amount: DecimalStringSchema,
  weighted_amount: DecimalStringSchema,
  conversion_percent: NullableDecimalStringSchema.optional().default(null),
});
export type SalesFunnelLine = z.infer<typeof SalesFunnelLineSchema>;

export const SalesFunnelSchema = z.object({
  currency_code: z.string().nullable().optional().default(null),
  pipeline_id: z.string().uuid(),
  pipeline_name: z.string(),
  opportunity_count: z.number().int(),
  total_amount: DecimalStringSchema,
  total_weighted_amount: DecimalStringSchema,
  lines: z.array(SalesFunnelLineSchema).default([]),
});
export type SalesFunnel = z.infer<typeof SalesFunnelSchema>;

export const WinLossLineSchema = z.object({
  group_key: z.string(),
  group_label: z.string(),
  won_count: z.number().int(),
  lost_count: z.number().int(),
  won_amount: DecimalStringSchema,
  lost_amount: DecimalStringSchema,
  win_percent: NullableDecimalStringSchema.optional().default(null),
});
export type WinLossLine = z.infer<typeof WinLossLineSchema>;

export const WinLossSchema = z.object({
  currency_code: z.string().nullable().optional().default(null),
  from_date: z.string(),
  to_date: z.string(),
  group_by: z.string(),
  won_count: z.number().int(),
  lost_count: z.number().int(),
  won_amount: DecimalStringSchema,
  lost_amount: DecimalStringSchema,
  win_percent: NullableDecimalStringSchema.optional().default(null),
  truncated: z.boolean().optional().default(false),
  lines: z.array(WinLossLineSchema).default([]),
});
export type WinLoss = z.infer<typeof WinLossSchema>;

export const LeadConversionLineSchema = z.object({
  group_key: z.string(),
  group_label: z.string(),
  lead_count: z.number().int(),
  converted_count: z.number().int(),
  conversion_percent: NullableDecimalStringSchema.optional().default(null),
});
export type LeadConversionLine = z.infer<typeof LeadConversionLineSchema>;

export const LeadConversionSchema = z.object({
  from_date: z.string(),
  to_date: z.string(),
  group_by: z.string(),
  lead_count: z.number().int(),
  converted_count: z.number().int(),
  conversion_percent: NullableDecimalStringSchema.optional().default(null),
  truncated: z.boolean().optional().default(false),
  lines: z.array(LeadConversionLineSchema).default([]),
});
export type LeadConversion = z.infer<typeof LeadConversionSchema>;

export const SalesActivityLineSchema = z.object({
  group_key: z.string(),
  group_label: z.string(),
  activity_count: z.number().int(),
  open_count: z.number().int(),
  completed_count: z.number().int(),
  overdue_count: z.number().int(),
});
export type SalesActivityLine = z.infer<typeof SalesActivityLineSchema>;

export const SalesActivitySchema = z.object({
  from_date: z.string(),
  to_date: z.string(),
  group_by: z.string(),
  activity_count: z.number().int(),
  open_count: z.number().int(),
  completed_count: z.number().int(),
  overdue_count: z.number().int(),
  truncated: z.boolean().optional().default(false),
  lines: z.array(SalesActivityLineSchema).default([]),
});
export type SalesActivity = z.infer<typeof SalesActivitySchema>;

export const CrmDashboardSchema = z.object({
  currency_code: z.string().nullable().optional().default(null),
  as_of: z.string(),
  open_pipeline_count: z.number().int(),
  open_pipeline_value: DecimalStringSchema,
  closing_this_month_count: z.number().int(),
  closing_this_month_value: DecimalStringSchema,
  overdue_activity_count: z.number().int(),
});
export type CrmDashboard = z.infer<typeof CrmDashboardSchema>;
