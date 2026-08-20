import { z } from "zod";

export const RoleSummarySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  is_system_role: z.boolean(),
});

export const SessionUserSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  name: z.string(),
  email: z.string(),
  phone: z.string().nullable(),
  status: z.enum(["ACTIVE", "INVITED", "DISABLED"]),
  last_login_at: z.string().nullable(),
  employee_id: z.string().uuid().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
  roles: z.array(RoleSummarySchema).default([]),
  permissions: z.array(z.string()).default([]),
});

export type SessionUser = z.infer<typeof SessionUserSchema>;
export type RoleSummary = z.infer<typeof RoleSummarySchema>;
