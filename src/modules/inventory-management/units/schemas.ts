import { z } from "zod";

export const UnitSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  code: z.string(),
  name: z.string(),
  is_active: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type Unit = z.infer<typeof UnitSchema>;

export const UnitListSchema = z.array(UnitSchema);

export const UnitCreateRequestSchema = z.object({
  code: z.string().min(1).max(20),
  name: z.string().min(1).max(100),
});
export type UnitCreateRequest = z.infer<typeof UnitCreateRequestSchema>;

export const UnitUpdateRequestSchema = z.object({
  name: z.string().min(1).max(100).nullable().optional(),
  is_active: z.boolean().nullable().optional(),
});
export type UnitUpdateRequest = z.infer<typeof UnitUpdateRequestSchema>;

export const UnitFormSchema = z.object({
  code: z.string().min(1, "Enter a code").max(20),
  name: z.string().min(1, "Enter a name").max(100),
  is_active: z.boolean(),
});
export type UnitFormValues = z.infer<typeof UnitFormSchema>;

export type UnitListParams = {
  page?: number;
  page_size?: number;
  search?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
  is_active?: boolean;
};
