import { z } from "zod";

export const CategorySchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  name: z.string(),
  code: z.string(),
  parent_id: z.string().uuid().nullable(),
  is_active: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type Category = z.infer<typeof CategorySchema>;

export const CategoryListSchema = z.array(CategorySchema);

export const CategoryCreateRequestSchema = z.object({
  name: z.string().min(1).max(150),
  code: z.string().min(1).max(50),
  parent_id: z.string().uuid().nullable().optional(),
});
export type CategoryCreateRequest = z.infer<typeof CategoryCreateRequestSchema>;

export const CategoryUpdateRequestSchema = z.object({
  name: z.string().min(1).max(150).nullable().optional(),
  parent_id: z.string().uuid().nullable().optional(),
  is_active: z.boolean().nullable().optional(),
});
export type CategoryUpdateRequest = z.infer<typeof CategoryUpdateRequestSchema>;

export const CategoryFormSchema = z.object({
  name: z.string().min(1, "Enter a name").max(150),
  code: z.string().min(1, "Enter a code").max(50),
  parent_id: z.string(),
  is_active: z.boolean(),
});
export type CategoryFormValues = z.infer<typeof CategoryFormSchema>;

export type CategoryListParams = {
  page?: number;
  page_size?: number;
  search?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
  parent_id?: string;
  is_active?: boolean;
};
