import { z } from "zod";

export const ActivityChangedFieldSchema = z.object({
  field: z.string(),
  old_value: z.unknown().optional(),
  new_value: z.unknown().optional(),
});
export type ActivityChangedField = z.infer<typeof ActivityChangedFieldSchema>;

export const ActivityEntrySchema = z.object({
  action: z.string(),
  actor_name: z.string().nullable(),
  occurred_at: z.string(),
  changed_fields: z.array(ActivityChangedFieldSchema),
  status: z.string(),
});
export type ActivityEntry = z.infer<typeof ActivityEntrySchema>;

export const ActivityListSchema = z.array(ActivityEntrySchema);

export type ActivityListParams = {
  entity_type: string;
  entity_id: string;
  page?: number;
  page_size?: number;
  search?: string;
  date_from?: string;
  date_to?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
};
