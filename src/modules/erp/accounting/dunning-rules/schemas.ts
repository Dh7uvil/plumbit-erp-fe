import { z } from "zod";

export const DUNNING_TEMPLATE_KEYS = [
  "PAYMENT_DUE_SOON",
  "PAYMENT_OVERDUE",
  "PAYMENT_ESCALATION",
] as const;

export const DUNNING_TEMPLATE_LABELS: Record<(typeof DUNNING_TEMPLATE_KEYS)[number], string> = {
  PAYMENT_DUE_SOON: "Payment due soon",
  PAYMENT_OVERDUE: "Payment overdue",
  PAYMENT_ESCALATION: "Escalation notice",
};

export const DunningRuleSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  name: z.string(),
  days_offset: z.number(),
  template_key: z.enum(DUNNING_TEMPLATE_KEYS),
  escalate: z.boolean(),
  description: z.string().nullable(),
  is_active: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
  created_by: z.string().uuid().nullable().optional().default(null),
  updated_by: z.string().uuid().nullable().optional().default(null),
});
export type DunningRule = z.infer<typeof DunningRuleSchema>;

export const DunningRuleListSchema = z.array(DunningRuleSchema);

export const DunningRuleCreateRequestSchema = z.object({
  name: z.string().min(1).max(150),
  days_offset: z.number().int().min(-365).max(365),
  template_key: z.enum(DUNNING_TEMPLATE_KEYS),
  escalate: z.boolean().optional(),
  description: z.string().nullable().optional(),
  is_active: z.boolean().optional(),
});
export type DunningRuleCreateRequest = z.infer<typeof DunningRuleCreateRequestSchema>;

export const DunningRuleUpdateRequestSchema = z.object({
  name: z.string().min(1).max(150).nullable().optional(),
  days_offset: z.number().int().min(-365).max(365).nullable().optional(),
  template_key: z.enum(DUNNING_TEMPLATE_KEYS).nullable().optional(),
  escalate: z.boolean().nullable().optional(),
  description: z.string().nullable().optional(),
  is_active: z.boolean().nullable().optional(),
});
export type DunningRuleUpdateRequest = z.infer<typeof DunningRuleUpdateRequestSchema>;

export const DunningRuleFormSchema = z.object({
  name: z.string().min(1, "Enter a name").max(150),
  days_offset: z.number().int().min(-365).max(365),
  template_key: z.enum(DUNNING_TEMPLATE_KEYS),
  escalate: z.boolean(),
  description: z.string(),
  is_active: z.boolean(),
});
export type DunningRuleFormValues = z.infer<typeof DunningRuleFormSchema>;

export type DunningRuleListParams = {
  page?: number;
  page_size?: number;
  search?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
  is_active?: boolean;
};

export const PaymentReminderLogSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  sales_invoice_id: z.string().uuid(),
  dunning_rule_id: z.string().uuid(),
  dunning_rule_name: z.string().nullable().optional(),
  channel: z.string(),
  recipient_email: z.string().nullable(),
  sent_at: z.string(),
  created_by: z.string().uuid().nullable().optional(),
});
export type PaymentReminderLog = z.infer<typeof PaymentReminderLogSchema>;

export const PaymentReminderLogListSchema = z.array(PaymentReminderLogSchema);

export const SendPaymentReminderResponseSchema = z.object({
  dunning_log_id: z.string().uuid(),
  recipient_email: z.string(),
});
