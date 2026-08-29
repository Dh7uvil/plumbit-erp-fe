import { ALLOWED_LOGO_MIME_TYPES, MAX_LOGO_BYTES } from "@/config/constants";
import {
  TenantCurrentSchema,
  TenantListSchema,
  type TenantCurrent,
  type TenantCurrentUpdate,
  type TenantPublic,
} from "@/modules/users-management/tenants/schemas";
import { apiClient } from "@/shared/api/client";
import { ApiError, getErrorMessage } from "@/shared/api/errors";

function assertLogoFile(file: File) {
  if (file.size > MAX_LOGO_BYTES) {
    throw new ApiError("VALIDATION_ERROR", getErrorMessage("VALIDATION_ERROR"), 400);
  }
  if (!(ALLOWED_LOGO_MIME_TYPES as readonly string[]).includes(file.type)) {
    throw new ApiError("VALIDATION_ERROR", getErrorMessage("VALIDATION_ERROR"), 400);
  }
}

export const tenantsApi = {
  list: async (): Promise<TenantPublic[]> =>
    TenantListSchema.parse(await apiClient.get("/tenants")),
  getCurrent: async (): Promise<TenantCurrent> =>
    TenantCurrentSchema.parse(await apiClient.get("/tenants/current")),
  updateCurrent: async (values: TenantCurrentUpdate): Promise<TenantCurrent> => {
    const data = await apiClient.patch("/tenants/current", values);
    const parsed = TenantCurrentSchema.safeParse(data);
    if (parsed.success) {
      return parsed.data;
    }
    return data as TenantCurrent;
  },
  uploadLogo: async (file: File): Promise<TenantCurrent> => {
    assertLogoFile(file);
    const body = new FormData();
    body.set("file", file);
    return TenantCurrentSchema.parse(await apiClient.postForm("/tenants/current/logo", body));
  },
  deleteLogo: async (): Promise<TenantCurrent> =>
    TenantCurrentSchema.parse(await apiClient.delete("/tenants/current/logo")),
};
