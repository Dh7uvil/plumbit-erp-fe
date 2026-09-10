"use client";

import { useQuery } from "@tanstack/react-query";

import { openingBalancesApi } from "@/modules/erp/accounting/opening-balances/api";
import { useTenantQueryKey } from "@/shared/hooks/use-tenant-query-key";

export const openingBalanceKeys = {
  all: ["opening-balances"] as const,
  state: () => [...openingBalanceKeys.all, "state"] as const,
};

export function useOpeningBalanceState() {
  return useQuery({
    queryKey: useTenantQueryKey(openingBalanceKeys.state()),
    queryFn: openingBalancesApi.get,
  });
}
