import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { useTenantQueryKey } from "@/shared/hooks/use-tenant-query-key";

import { chargeTypesApi } from "./api";
import type { ChargeTypeListParams } from "./schemas";

export const chargeTypeKeys = {
  all: ["charge-types"] as const,
  list: (params: ChargeTypeListParams) => [...chargeTypeKeys.all, "list", params] as const,
  active: () => [...chargeTypeKeys.all, "active"] as const,
};

export function useChargeTypes(params: ChargeTypeListParams) {
  return useQuery({
    queryKey: useTenantQueryKey(chargeTypeKeys.list(params)),
    queryFn: () => chargeTypesApi.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useActiveChargeTypes() {
  return useQuery({
    queryKey: useTenantQueryKey(chargeTypeKeys.active()),
    queryFn: () => chargeTypesApi.listAllActive(),
  });
}
