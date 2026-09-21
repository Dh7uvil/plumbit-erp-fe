import { z } from "zod";

import {
  CrmRelatedEntityTypeSchema,
  type CrmRelatedEntityType,
} from "@/modules/crm/activities/schemas";

export const NoteSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  body: z.string(),
  related_entity_type: CrmRelatedEntityTypeSchema,
  related_entity_id: z.string().uuid(),
  created_at: z.string(),
  updated_at: z.string(),
  created_by: z.string().uuid().nullable().optional().default(null),
  updated_by: z.string().uuid().nullable().optional().default(null),
});
export type Note = z.infer<typeof NoteSchema>;
export const NoteListSchema = z.array(NoteSchema);

export const NoteCreateRequestSchema = z.object({
  body: z.string().min(1),
  related_entity_type: CrmRelatedEntityTypeSchema,
  related_entity_id: z.string().uuid(),
});
export type NoteCreateRequest = z.infer<typeof NoteCreateRequestSchema>;

export const NoteUpdateRequestSchema = z.object({
  body: z.string().min(1).optional(),
});
export type NoteUpdateRequest = z.infer<typeof NoteUpdateRequestSchema>;

export const NoteFormSchema = z.object({
  body: z.string().min(1, "Enter a note"),
});
export type NoteFormValues = z.infer<typeof NoteFormSchema>;

export type NoteListParams = {
  page?: number;
  page_size?: number;
  search?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
  related_entity_type?: CrmRelatedEntityType;
  related_entity_id?: string;
};
