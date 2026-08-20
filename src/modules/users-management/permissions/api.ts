import {
  PermissionMatrixResponseSchema,
  type PermissionMatrixResponse,
} from "@/modules/users-management/permissions/schemas";
import { apiClient } from "@/shared/api/client";

export const permissionsApi = {
  matrix: async (roleId?: string | null): Promise<PermissionMatrixResponse> =>
    PermissionMatrixResponseSchema.parse(
      await apiClient.get("/permissions/matrix", {
        params: { role_id: roleId ?? undefined },
      }),
    ),
};
