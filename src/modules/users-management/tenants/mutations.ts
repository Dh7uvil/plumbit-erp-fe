"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { tenantsApi } from "@/modules/users-management/tenants/api";
import { tenantKeys } from "@/modules/users-management/tenants/queries";

export function useUpdateCurrentTenant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: tenantsApi.updateCurrent,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: tenantKeys.all });
    },
  });
}
