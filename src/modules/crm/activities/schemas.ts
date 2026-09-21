import { z } from "zod";

export const CRM_RELATED_ENTITY_TYPES = ["lead", "opportunity", "customer", "contact"] as const;
export const CrmRelatedEntityTypeSchema = z.enum(CRM_RELATED_ENTITY_TYPES);
export type CrmRelatedEntityType = z.infer<typeof CrmRelatedEntityTypeSchema>;

export const CRM_RELATED_ENTITY_LABELS: Record<CrmRelatedEntityType, string> = {
  lead: "Lead",
  opportunity: "Opportunity",
  customer: "Customer",
  contact: "Contact",
};

export function relatedEntityHref(type: CrmRelatedEntityType, id: string): string {
  const prefixes: Record<CrmRelatedEntityType, string> = {
    lead: "/leads",
    opportunity: "/opportunities",
    customer: "/customers",
    contact: "/contacts",
  };
  return `${prefixes[type]}/${id}`;
}

export const ACTIVITY_TYPES = ["TASK", "CALL", "MEETING"] as const;
export const ActivityTypeSchema = z.enum(ACTIVITY_TYPES);
export type ActivityType = z.infer<typeof ActivityTypeSchema>;

export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  TASK: "Task",
  CALL: "Call",
  MEETING: "Meeting",
};

export const ACTIVITY_STATUSES = ["OPEN", "COMPLETED", "CANCELLED"] as const;
export const ActivityStatusSchema = z.enum(ACTIVITY_STATUSES);
export type ActivityStatus = z.infer<typeof ActivityStatusSchema>;

export const ACTIVITY_STATUS_LABELS: Record<ActivityStatus, string> = {
  OPEN: "Open",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export const ACTIVITY_STATUS_VARIANTS: Record<
  ActivityStatus,
  "muted" | "info" | "success" | "destructive" | "warning"
> = {
  OPEN: "warning",
  COMPLETED: "success",
  CANCELLED: "destructive",
};

export const ACTIVITY_PRIORITIES = ["LOW", "MEDIUM", "HIGH"] as const;
export const ActivityPrioritySchema = z.enum(ACTIVITY_PRIORITIES);
export type ActivityPriority = z.infer<typeof ActivityPrioritySchema>;

export const ACTIVITY_PRIORITY_LABELS: Record<ActivityPriority, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
};

export const ActivitySchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  activity_type: ActivityTypeSchema,
  subject: z.string(),
  description: z.string().nullable(),
  status: ActivityStatusSchema,
  priority: ActivityPrioritySchema,
  due_at: z.string().nullable(),
  start_at: z.string().nullable(),
  end_at: z.string().nullable(),
  duration_minutes: z.number().int().nullable(),
  outcome: z.string().nullable(),
  owner_id: z.string().uuid().nullable(),
  related_entity_type: CrmRelatedEntityTypeSchema,
  related_entity_id: z.string().uuid(),
  available_actions: z.array(z.string()).default([]),
  created_at: z.string(),
  updated_at: z.string(),
  created_by: z.string().uuid().nullable().optional().default(null),
  updated_by: z.string().uuid().nullable().optional().default(null),
});
export type Activity = z.infer<typeof ActivitySchema>;
export const ActivityListSchema = z.array(ActivitySchema);

export const ActivityCreateRequestSchema = z.object({
  activity_type: ActivityTypeSchema,
  subject: z.string().min(1).max(200),
  description: z.string().nullable().optional(),
  priority: ActivityPrioritySchema.optional(),
  due_at: z.string().nullable().optional(),
  start_at: z.string().nullable().optional(),
  end_at: z.string().nullable().optional(),
  duration_minutes: z.number().int().nonnegative().nullable().optional(),
  owner_id: z.string().uuid().nullable().optional(),
  related_entity_type: CrmRelatedEntityTypeSchema,
  related_entity_id: z.string().uuid(),
});
export type ActivityCreateRequest = z.infer<typeof ActivityCreateRequestSchema>;

export const ActivityUpdateRequestSchema = ActivityCreateRequestSchema.partial().extend({
  status: z.enum(["OPEN", "CANCELLED"]).optional(),
});
export type ActivityUpdateRequest = z.infer<typeof ActivityUpdateRequestSchema>;

export const ActivityCompleteRequestSchema = z.object({
  outcome: z.string().nullable().optional(),
});
export type ActivityCompleteRequest = z.infer<typeof ActivityCompleteRequestSchema>;

export const ActivityFormSchema = z.object({
  activity_type: ActivityTypeSchema,
  subject: z.string().min(1, "Enter a subject").max(200),
  description: z.string(),
  priority: ActivityPrioritySchema,
  due_at: z.string(),
  related_entity_type: CrmRelatedEntityTypeSchema,
  related_entity_id: z.string().uuid("Select a related record"),
});
export type ActivityFormValues = z.infer<typeof ActivityFormSchema>;

export function defaultActivityFormValues(related?: {
  type: CrmRelatedEntityType;
  id: string;
}): ActivityFormValues {
  return {
    activity_type: "TASK",
    subject: "",
    description: "",
    priority: "MEDIUM",
    due_at: "",
    related_entity_type: related?.type ?? "lead",
    related_entity_id: related?.id ?? "",
  };
}

export type ActivityListParams = {
  page?: number;
  page_size?: number;
  search?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
  related_entity_type?: CrmRelatedEntityType;
  related_entity_id?: string;
  owner_id?: string;
  status?: ActivityStatus;
  activity_type?: ActivityType;
  overdue?: boolean;
  mine?: boolean;
  due_from?: string;
  due_to?: string;
};

export function toDatetimeLocal(value: string | null | undefined): string {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function fromDatetimeLocal(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toISOString();
}

export function thisWeekRange(): { due_from: string; due_to: string } {
  const now = new Date();
  const day = now.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() + mondayOffset);
  const end = new Date(start);
  end.setDate(start.getDate() + 7);
  return { due_from: start.toISOString(), due_to: end.toISOString() };
}
