import { z } from "zod";

export const PipelineStageKindSchema = z.enum(["OPEN", "WON", "LOST"]);
export type PipelineStageKind = z.infer<typeof PipelineStageKindSchema>;

export const PipelineStageSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  pipeline_id: z.string().uuid(),
  name: z.string(),
  sort_order: z.number().int(),
  probability: z.string(),
  stage_kind: PipelineStageKindSchema,
  created_at: z.string(),
  updated_at: z.string(),
});
export type PipelineStage = z.infer<typeof PipelineStageSchema>;

export const PipelineListItemSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  name: z.string(),
  is_default: z.boolean(),
  is_active: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
  created_by: z.string().uuid().nullable().optional().default(null),
  updated_by: z.string().uuid().nullable().optional().default(null),
});
export type PipelineListItem = z.infer<typeof PipelineListItemSchema>;

export const PipelineSchema = PipelineListItemSchema.extend({
  stages: z.array(PipelineStageSchema).default([]),
});
export type Pipeline = z.infer<typeof PipelineSchema>;

export const PipelineListSchema = z.array(PipelineListItemSchema);

export const PipelineCreateRequestSchema = z.object({
  name: z.string().min(1).max(150),
  is_default: z.boolean().optional(),
});
export type PipelineCreateRequest = z.infer<typeof PipelineCreateRequestSchema>;

export const PipelineUpdateRequestSchema = z.object({
  name: z.string().min(1).max(150).nullable().optional(),
  is_default: z.boolean().nullable().optional(),
  is_active: z.boolean().nullable().optional(),
});
export type PipelineUpdateRequest = z.infer<typeof PipelineUpdateRequestSchema>;

export const PipelineStageCreateRequestSchema = z.object({
  name: z.string().min(1).max(150),
  sort_order: z.number().int().min(0).max(999),
  probability: z.string(),
  stage_kind: PipelineStageKindSchema,
});
export type PipelineStageCreateRequest = z.infer<typeof PipelineStageCreateRequestSchema>;

export const PipelineStageUpdateRequestSchema = z.object({
  name: z.string().min(1).max(150).nullable().optional(),
  sort_order: z.number().int().min(0).max(999).nullable().optional(),
  probability: z.string().nullable().optional(),
  stage_kind: PipelineStageKindSchema.nullable().optional(),
});
export type PipelineStageUpdateRequest = z.infer<typeof PipelineStageUpdateRequestSchema>;

export const PipelineFormSchema = z.object({
  name: z.string().min(1, "Enter a name").max(150),
  is_default: z.boolean(),
  is_active: z.boolean(),
});
export type PipelineFormValues = z.infer<typeof PipelineFormSchema>;

export type PipelineListParams = {
  page?: number;
  page_size?: number;
  search?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
  is_active?: boolean;
  is_default?: boolean;
};
