"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { tenantsApi } from "@/modules/users-management/tenants/api";
import { tenantKeys } from "@/modules/users-management/tenants/queries";
import type { TenantCurrent } from "@/modules/users-management/tenants/schemas";

export function useUpdateCurrentTenant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: tenantsApi.updateCurrent,
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({ queryKey: tenantKeys.all });
      queryClient.setQueryData<TenantCurrent>(tenantKeys.current(), (current) => {
        if (!current) {
          return current;
        }
        return {
          ...current,
          ...(variables.default_currency !== undefined
            ? { default_currency: variables.default_currency }
            : {}),
          ...(variables.default_currency_id !== undefined
            ? { default_currency_id: variables.default_currency_id }
            : {}),
        };
      });
    },
  });
}

export function useUploadTenantLogo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: tenantsApi.uploadLogo,
    retry: false,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: tenantKeys.all });
    },
  });
}

export function useDeleteTenantLogo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: tenantsApi.deleteLogo,
    retry: false,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: tenantKeys.all });
    },
  });
}
