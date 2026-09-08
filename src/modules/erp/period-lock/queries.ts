"use client";

import { useQuery } from "@tanstack/react-query";

import { periodLockApi } from "@/modules/erp/period-lock/api";
import { useTenantQueryKey } from "@/shared/hooks/use-tenant-query-key";

export const periodLockKeys = {
  all: ["period-lock"] as const,
  current: () => [...periodLockKeys.all, "current"] as const,
};

export function usePeriodLock() {
  return useQuery({
    queryKey: useTenantQueryKey(periodLockKeys.current()),
    queryFn: periodLockApi.get,
  });
}
