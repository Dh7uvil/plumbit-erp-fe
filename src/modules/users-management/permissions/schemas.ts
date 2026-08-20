import { z } from "zod";

export const PermissionMatrixActionSchema = z.object({
  id: z.string().uuid(),
  action: z.string(),
  code: z.string(),
  granted: z.boolean(),
});
export type PermissionMatrixAction = z.infer<typeof PermissionMatrixActionSchema>;

export const PermissionMatrixResourceSchema = z.object({
  resource: z.string(),
  actions: z.array(PermissionMatrixActionSchema),
});
export type PermissionMatrixResource = z.infer<typeof PermissionMatrixResourceSchema>;

export const PermissionMatrixModuleSchema = z.object({
  module: z.string(),
  resources: z.array(PermissionMatrixResourceSchema),
});
export type PermissionMatrixModule = z.infer<typeof PermissionMatrixModuleSchema>;

export const PermissionMatrixResponseSchema = z.object({
  modules: z.array(PermissionMatrixModuleSchema),
});
export type PermissionMatrixResponse = z.infer<typeof PermissionMatrixResponseSchema>;
