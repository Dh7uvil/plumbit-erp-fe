import { z } from "zod";

export const LeadSourceSchema = z.object({
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
export type LeadSource = z.infer<typeof LeadSourceSchema>;

export const LeadSourceListSchema = z.array(LeadSourceSchema);

export const LeadSourceCreateRequestSchema = z.object({
  name: z.string().min(1).max(150),
  description: z.string().nullable().optional(),
});
export type LeadSourceCreateRequest = z.infer<typeof LeadSourceCreateRequestSchema>;

export const LeadSourceUpdateRequestSchema = z.object({
  name: z.string().min(1).max(150).nullable().optional(),
  description: z.string().nullable().optional(),
  is_active: z.boolean().nullable().optional(),
});
export type LeadSourceUpdateRequest = z.infer<typeof LeadSourceUpdateRequestSchema>;

export const LeadSourceFormSchema = z.object({
  name: z.string().min(1, "Enter a name").max(150),
  description: z.string(),
  is_active: z.boolean(),
});
export type LeadSourceFormValues = z.infer<typeof LeadSourceFormSchema>;

export type LeadSourceListParams = {
  page?: number;
  page_size?: number;
  search?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
  is_active?: boolean;
};
