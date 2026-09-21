import { z } from "zod";

export const LostReasonSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  is_active: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
  created_by: z.string().uuid().nullable().optional().default(null),
  updated_by: z.string().uuid().nullable().optional().default(null),
});
export type LostReason = z.infer<typeof LostReasonSchema>;

export const LostReasonListSchema = z.array(LostReasonSchema);

export const LostReasonCreateRequestSchema = z.object({
  name: z.string().min(1).max(150),
  description: z.string().nullable().optional(),
});
export type LostReasonCreateRequest = z.infer<typeof LostReasonCreateRequestSchema>;

export const LostReasonUpdateRequestSchema = z.object({
  name: z.string().min(1).max(150).nullable().optional(),
  description: z.string().nullable().optional(),
  is_active: z.boolean().nullable().optional(),
});
export type LostReasonUpdateRequest = z.infer<typeof LostReasonUpdateRequestSchema>;

export const LostReasonFormSchema = z.object({
  name: z.string().min(1, "Enter a name").max(150),
  description: z.string(),
  is_active: z.boolean(),
});
export type LostReasonFormValues = z.infer<typeof LostReasonFormSchema>;

export type LostReasonListParams = {
  page?: number;
  page_size?: number;
  search?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
  is_active?: boolean;
};
