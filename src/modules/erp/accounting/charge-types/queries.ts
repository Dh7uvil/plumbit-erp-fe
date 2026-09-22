import { useQuery } from "@tanstack/react-query";

import { chargeTypesApi } from "./api";
import type { ChargeTypeListParams } from "./schemas";

export const chargeTypeKeys = {
  all: ["charge-types"] as const,
  list: (params: ChargeTypeListParams) => [...chargeTypeKeys.all, "list", params] as const,
  active: () => [...chargeTypeKeys.all, "active"] as const,
};

export function useChargeTypes(params: ChargeTypeListParams) {
  return useQuery({
    queryKey: chargeTypeKeys.list(params),
    queryFn: () => chargeTypesApi.list(params),
  });
}

export function useActiveChargeTypes() {
  return useQuery({
    queryKey: chargeTypeKeys.active(),
    queryFn: () => chargeTypesApi.listAllActive(),
  });
}
