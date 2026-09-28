import { z } from "zod";

export const TaskLabelSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  name: z.string(),
  color: z.string(),
  is_active: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
  created_by: z.string().uuid().nullable().optional().default(null),
  updated_by: z.string().uuid().nullable().optional().default(null),
});
export type TaskLabel = z.infer<typeof TaskLabelSchema>;
export const TaskLabelListSchema = z.array(TaskLabelSchema);

export const TaskLabelCreateRequestSchema = z.object({
  name: z.string().min(1).max(50),
  color: z.string().min(1).max(20).optional(),
});
export type TaskLabelCreateRequest = z.infer<typeof TaskLabelCreateRequestSchema>;

export const TaskLabelUpdateRequestSchema = TaskLabelCreateRequestSchema.partial().extend({
  is_active: z.boolean().optional(),
});
export type TaskLabelUpdateRequest = z.infer<typeof TaskLabelUpdateRequestSchema>;

export type TaskLabelListParams = {
  page?: number;
  page_size?: number;
  search?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
  is_active?: boolean;
};
