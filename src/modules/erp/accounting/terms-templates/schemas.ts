import { z } from "zod";

export const TermsTemplateSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  name: z.string(),
  body: z.string(),
  is_default: z.boolean(),
  is_active: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type TermsTemplate = z.infer<typeof TermsTemplateSchema>;

export const TermsTemplateListSchema = z.array(TermsTemplateSchema);

export const TermsTemplateCreateRequestSchema = z.object({
  name: z.string().min(1).max(150),
  body: z.string().min(1),
  is_default: z.boolean().optional(),
});
export type TermsTemplateCreateRequest = z.infer<typeof TermsTemplateCreateRequestSchema>;

export const TermsTemplateUpdateRequestSchema = z.object({
  name: z.string().min(1).max(150).nullable().optional(),
  body: z.string().min(1).nullable().optional(),
  is_default: z.boolean().nullable().optional(),
  is_active: z.boolean().nullable().optional(),
});
export type TermsTemplateUpdateRequest = z.infer<typeof TermsTemplateUpdateRequestSchema>;

export const TermsTemplateFormSchema = z.object({
  name: z.string().min(1, "Enter a name").max(150),
  body: z.string().min(1, "Enter terms"),
  is_default: z.boolean(),
  is_active: z.boolean(),
});
export type TermsTemplateFormValues = z.infer<typeof TermsTemplateFormSchema>;

export type TermsTemplateListParams = {
  page?: number;
  page_size?: number;
  search?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
  is_active?: boolean;
};
