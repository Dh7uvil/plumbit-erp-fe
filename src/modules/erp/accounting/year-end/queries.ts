"use client";

import { useQuery } from "@tanstack/react-query";

import { yearEndApi } from "@/modules/erp/accounting/year-end/api";
import { useTenantQueryKey } from "@/shared/hooks/use-tenant-query-key";

export const yearEndKeys = {
  all: ["year-end"] as const,
  state: (fiscalYear: number) => [...yearEndKeys.all, "state", fiscalYear] as const,
};

export function useYearEndState(fiscalYear: number | null) {
  return useQuery({
    queryKey: useTenantQueryKey(yearEndKeys.state(fiscalYear ?? 0)),
    queryFn: () => yearEndApi.getState(fiscalYear!),
    enabled: fiscalYear != null && fiscalYear >= 1900,
  });
}
