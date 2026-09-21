import { z } from "zod";

export const CostCenterSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  name: z.string(),
  code: z.string(),
  description: z.string().nullable(),
  is_active: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
  created_by: z.string().uuid().nullable().optional().default(null),
  updated_by: z.string().uuid().nullable().optional().default(null),
});
export type CostCenter = z.infer<typeof CostCenterSchema>;

export const CostCenterListSchema = z.array(CostCenterSchema);

export const CostCenterCreateRequestSchema = z.object({
  name: z.string().min(1).max(150),
  code: z.string().min(1).max(30),
  description: z.string().nullable().optional(),
});
export type CostCenterCreateRequest = z.infer<typeof CostCenterCreateRequestSchema>;

export const CostCenterUpdateRequestSchema = z.object({
  name: z.string().min(1).max(150).nullable().optional(),
  code: z.string().min(1).max(30).nullable().optional(),
  description: z.string().nullable().optional(),
  is_active: z.boolean().nullable().optional(),
});
export type CostCenterUpdateRequest = z.infer<typeof CostCenterUpdateRequestSchema>;

export const CostCenterFormSchema = z.object({
  name: z.string().min(1, "Enter a name").max(150),
  code: z.string().min(1, "Enter a code").max(30),
  description: z.string(),
  is_active: z.boolean(),
});
export type CostCenterFormValues = z.infer<typeof CostCenterFormSchema>;

export type CostCenterListParams = {
  page?: number;
  page_size?: number;
  search?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
  is_active?: boolean;
};
