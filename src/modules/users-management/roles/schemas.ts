import { z } from "zod";

export const PermissionSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  module: z.string(),
  resource: z.string(),
  action: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
  code: z.string().default(""),
});
export type Permission = z.infer<typeof PermissionSchema>;

export const RoleSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  is_system_role: z.boolean(),
  user_count: z.number().int().nonnegative().default(0),
  created_at: z.string(),
  updated_at: z.string(),
});
export type Role = z.infer<typeof RoleSchema>;

export const RoleListSchema = z.array(RoleSchema);

export const RoleDetailSchema = RoleSchema.extend({
  permissions: z.array(PermissionSchema).default([]),
});
export type RoleDetail = z.infer<typeof RoleDetailSchema>;

export const RoleCreateRequestSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().nullable().optional(),
  permission_ids: z.array(z.string().uuid()).optional(),
});
export type RoleCreateRequest = z.infer<typeof RoleCreateRequestSchema>;

export const RoleUpdateRequestSchema = z.object({
  name: z.string().min(1).max(100).nullable().optional(),
  description: z.string().nullable().optional(),
});
export type RoleUpdateRequest = z.infer<typeof RoleUpdateRequestSchema>;

export const RoleFormSchema = z.object({
  name: z.string().min(1, "Enter a name").max(100),
  description: z.string(),
});
export type RoleFormValues = z.infer<typeof RoleFormSchema>;

export const SetRolePermissionsRequestSchema = z.object({
  permission_ids: z.array(z.string().uuid()),
});

export type RoleListParams = {
  page?: number;
  page_size?: number;
  search?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
};
