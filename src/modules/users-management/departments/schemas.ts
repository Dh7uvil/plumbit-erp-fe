import { z } from "zod";

export const DEPARTMENT_SELECT_NONE = "none";

export const DepartmentBranchSummarySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  code: z.string(),
});
export type DepartmentBranchSummary = z.infer<typeof DepartmentBranchSummarySchema>;

export const DepartmentManagerSummarySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
});
export type DepartmentManagerSummary = z.infer<typeof DepartmentManagerSummarySchema>;

export const DepartmentSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  name: z.string(),
  code: z.string(),
  branch_id: z.string().uuid(),
  branch: DepartmentBranchSummarySchema.nullable().optional(),
  manager_id: z.string().uuid().nullable(),
  manager: DepartmentManagerSummarySchema.nullable().optional(),
  employee_count: z.number().int().nonnegative().default(0),
  created_at: z.string(),
  updated_at: z.string(),
});
export type Department = z.infer<typeof DepartmentSchema>;

export const DepartmentListSchema = z.array(DepartmentSchema);

export const DepartmentCreateRequestSchema = z.object({
  name: z.string().min(1).max(150),
  code: z.string().min(1).max(50),
  branch_id: z.string().uuid(),
  manager_id: z.string().uuid().nullable().optional(),
});
export type DepartmentCreateRequest = z.infer<typeof DepartmentCreateRequestSchema>;

export const DepartmentUpdateRequestSchema = z.object({
  name: z.string().min(1).max(150).nullable().optional(),
  code: z.string().min(1).max(50).nullable().optional(),
  branch_id: z.string().uuid().nullable().optional(),
  manager_id: z.string().uuid().nullable().optional(),
});
export type DepartmentUpdateRequest = z.infer<typeof DepartmentUpdateRequestSchema>;

export const DepartmentFormSchema = z.object({
  name: z.string().min(1, "Enter a name").max(150),
  code: z.string().min(1, "Enter a code").max(50),
  branch_id: z.string().uuid("Select a branch"),
  manager_id: z.string(),
});
export type DepartmentFormValues = z.infer<typeof DepartmentFormSchema>;

export type DepartmentListParams = {
  page?: number;
  page_size?: number;
  search?: string;
  branch_id?: string;
};
