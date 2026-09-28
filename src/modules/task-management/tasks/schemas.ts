import { z } from "zod";

export const TASK_STATUSES = [
  "TODO",
  "IN_PROGRESS",
  "IN_REVIEW",
  "BLOCKED",
  "DONE",
  "CANCELLED",
] as const;
export const TaskStatusSchema = z.enum(TASK_STATUSES);
export type TaskStatus = z.infer<typeof TaskStatusSchema>;

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  TODO: "To do",
  IN_PROGRESS: "In progress",
  IN_REVIEW: "In review",
  BLOCKED: "Blocked",
  DONE: "Done",
  CANCELLED: "Cancelled",
};

export const TASK_STATUS_VARIANTS: Record<
  TaskStatus,
  "muted" | "info" | "success" | "destructive" | "warning"
> = {
  TODO: "muted",
  IN_PROGRESS: "info",
  IN_REVIEW: "warning",
  BLOCKED: "destructive",
  DONE: "success",
  CANCELLED: "muted",
};

export const TASK_TYPES = ["TASK", "BUG", "STORY", "EPIC"] as const;
export const TaskTypeSchema = z.enum(TASK_TYPES);
export type TaskType = z.infer<typeof TaskTypeSchema>;

export const TASK_TYPE_LABELS: Record<TaskType, string> = {
  TASK: "Task",
  BUG: "Bug",
  STORY: "Story",
  EPIC: "Epic",
};

export const TASK_TYPE_META: Record<
  TaskType,
  { icon: "SquareCheck" | "Bug" | "Bookmark" | "Zap"; color: string }
> = {
  TASK: { icon: "SquareCheck", color: "text-blue-600" },
  BUG: { icon: "Bug", color: "text-red-600" },
  STORY: { icon: "Bookmark", color: "text-green-600" },
  EPIC: { icon: "Zap", color: "text-purple-600" },
};

export const TASK_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;
export const TaskPrioritySchema = z.enum(TASK_PRIORITIES);
export type TaskPriority = z.infer<typeof TaskPrioritySchema>;

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  URGENT: "Urgent",
};

export const TASK_RELATED_ENTITY_TYPES = [
  "customer",
  "contact",
  "lead",
  "opportunity",
  "product",
  "quotation",
  "sales_order",
  "purchase_order",
  "goods_receipt",
  "supplier",
] as const;
export const TaskRelatedEntityTypeSchema = z.enum(TASK_RELATED_ENTITY_TYPES);
export type TaskRelatedEntityType = z.infer<typeof TaskRelatedEntityTypeSchema>;

export const TASK_RELATED_ENTITY_LABELS: Record<TaskRelatedEntityType, string> = {
  customer: "Customer",
  contact: "Contact",
  lead: "Lead",
  opportunity: "Opportunity",
  product: "Product",
  quotation: "Quotation",
  sales_order: "Sales order",
  purchase_order: "Purchase order",
  goods_receipt: "Goods receipt",
  supplier: "Supplier",
};

export function relatedEntityHref(type: TaskRelatedEntityType, id: string): string {
  const prefixes: Record<TaskRelatedEntityType, string> = {
    customer: "/customers",
    contact: "/contacts",
    lead: "/leads",
    opportunity: "/opportunities",
    product: "/products",
    quotation: "/quotations",
    sales_order: "/sales-orders",
    purchase_order: "/purchase-orders",
    goods_receipt: "/goods-receipts",
    supplier: "/suppliers",
  };
  return `${prefixes[type]}/${id}`;
}

export const TaskLabelSummarySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  color: z.string(),
});
export type TaskLabelSummary = z.infer<typeof TaskLabelSummarySchema>;

export const TaskChecklistItemSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  task_id: z.string().uuid(),
  title: z.string(),
  is_done: z.boolean(),
  sort_order: z.number().int(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type TaskChecklistItem = z.infer<typeof TaskChecklistItemSchema>;

export const TaskCommentSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  task_id: z.string().uuid(),
  body: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
  created_by: z.string().uuid().nullable().optional().default(null),
  updated_by: z.string().uuid().nullable().optional().default(null),
});
export type TaskComment = z.infer<typeof TaskCommentSchema>;

export const TaskParentSummarySchema = z.object({
  id: z.string().uuid(),
  task_number: z.string(),
  title: z.string(),
  task_type: TaskTypeSchema,
});
export type TaskParentSummary = z.infer<typeof TaskParentSummarySchema>;

export const TaskSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  task_number: z.string(),
  task_type: TaskTypeSchema.default("TASK"),
  title: z.string(),
  description: z.string().nullable(),
  status: TaskStatusSchema,
  priority: TaskPrioritySchema,
  due_at: z.string().nullable(),
  started_at: z.string().nullable(),
  completed_at: z.string().nullable(),
  assignee_id: z.string().uuid().nullable(),
  parent_id: z.string().uuid().nullable().optional().default(null),
  sort_order: z.number().int(),
  related_entity_type: TaskRelatedEntityTypeSchema.nullable(),
  related_entity_id: z.string().uuid().nullable(),
  parent: TaskParentSummarySchema.nullable().optional().default(null),
  subtask_count: z.number().int().default(0),
  subtask_done_count: z.number().int().default(0),
  labels: z.array(TaskLabelSummarySchema).default([]),
  watcher_ids: z.array(z.string().uuid()).default([]),
  checklist_items: z.array(TaskChecklistItemSchema).default([]),
  available_actions: z.array(z.string()).default([]),
  created_at: z.string(),
  updated_at: z.string(),
  created_by: z.string().uuid().nullable().optional().default(null),
  updated_by: z.string().uuid().nullable().optional().default(null),
});
export type Task = z.infer<typeof TaskSchema>;
export const TaskListSchema = z.array(TaskSchema);

export const TaskCreateRequestSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().nullable().optional(),
  task_type: TaskTypeSchema.optional(),
  priority: TaskPrioritySchema.optional(),
  due_at: z.string().nullable().optional(),
  assignee_id: z.string().uuid().nullable().optional(),
  parent_id: z.string().uuid().nullable().optional(),
  related_entity_type: TaskRelatedEntityTypeSchema.nullable().optional(),
  related_entity_id: z.string().uuid().nullable().optional(),
  label_ids: z.array(z.string().uuid()).optional(),
  watcher_ids: z.array(z.string().uuid()).optional(),
});
export type TaskCreateRequest = z.infer<typeof TaskCreateRequestSchema>;

export const TaskUpdateRequestSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().nullable().optional(),
  task_type: TaskTypeSchema.optional(),
  priority: TaskPrioritySchema.optional(),
  due_at: z.string().nullable().optional(),
  assignee_id: z.string().uuid().nullable().optional(),
  parent_id: z.string().uuid().nullable().optional(),
  related_entity_type: TaskRelatedEntityTypeSchema.nullable().optional(),
  related_entity_id: z.string().uuid().nullable().optional(),
});
export type TaskUpdateRequest = z.infer<typeof TaskUpdateRequestSchema>;

export const TaskMoveRequestSchema = z.object({
  status: TaskStatusSchema,
  sort_order: z.number().int().nonnegative(),
});
export type TaskMoveRequest = z.infer<typeof TaskMoveRequestSchema>;

export const TaskAssignRequestSchema = z.object({
  assignee_id: z.string().uuid().nullable(),
});
export type TaskAssignRequest = z.infer<typeof TaskAssignRequestSchema>;

const TASK_FORM_NONE = "__none__";

export const TaskFormSchema = z
  .object({
    title: z.string().min(1, "Enter a title").max(200),
    description: z.string(),
    task_type: TaskTypeSchema,
    priority: TaskPrioritySchema,
    due_at: z.string(),
    assignee_id: z.string(),
    parent_id: z.string(),
    related_entity_type: z.string(),
    related_entity_id: z.string(),
    label_ids: z.array(z.string()),
    watcher_ids: z.array(z.string()),
  })
  .superRefine((values, ctx) => {
    if (
      values.related_entity_type !== TASK_FORM_NONE &&
      values.related_entity_type &&
      !z.string().uuid().safeParse(values.related_entity_id).success
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Select a related record",
        path: ["related_entity_id"],
      });
    }
  });
export type TaskFormValues = z.infer<typeof TaskFormSchema>;

export type TaskListParams = {
  page?: number;
  page_size?: number;
  search?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
  status?: TaskStatus;
  statuses?: TaskStatus[];
  priority?: TaskPriority;
  priorities?: TaskPriority[];
  assignee_id?: string;
  assignee_ids?: string[];
  unassigned?: boolean;
  mine?: boolean;
  overdue?: boolean;
  due_from?: string;
  due_to?: string;
  label_id?: string;
  label_ids?: string[];
  task_types?: TaskType[];
  parent_id?: string;
  top_level_only?: boolean;
  related_entity_type?: TaskRelatedEntityType;
  related_entity_id?: string;
};

export function parseIdList(value: string | undefined): string[] {
  if (!value?.trim()) return [];
  return value.split(",").filter(Boolean);
}

export function serializeIdList(values: string[] | undefined): string | undefined {
  if (!values?.length) return undefined;
  return values.join(",");
}

export function parseEnumList<T extends string>(value: string | undefined): T[] {
  if (!value?.trim()) return [];
  return value.split(",").filter(Boolean) as T[];
}

export function serializeEnumList<T extends string>(values: T[] | undefined): string | undefined {
  if (!values?.length) return undefined;
  return values.join(",");
}

export const BOARD_STATUS_KEYS: Record<TaskStatus, string> = {
  TODO: "todo",
  IN_PROGRESS: "in_progress",
  IN_REVIEW: "in_review",
  BLOCKED: "blocked",
  DONE: "done",
  CANCELLED: "cancelled",
};

export const BOARD_KEY_TO_STATUS: Record<string, TaskStatus> = Object.fromEntries(
  Object.entries(BOARD_STATUS_KEYS).map(([status, key]) => [key, status as TaskStatus]),
) as Record<string, TaskStatus>;

export const MAX_TASK_DEPTH = 3;

export function toDatetimeLocal(value: string | null | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function fromDatetimeLocal(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) return null;
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

export function canMoveToStatus(task: Task, status: TaskStatus): boolean {
  return task.available_actions.includes(`move:${status}`);
}
