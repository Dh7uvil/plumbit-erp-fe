"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { periodLockApi } from "@/modules/erp/period-lock/api";
import { periodLockKeys } from "@/modules/erp/period-lock/queries";
import { stockKeys } from "@/modules/inventory-management/stock/queries";
import { stockAdjustmentKeys } from "@/modules/inventory-management/stock-adjustments/queries";
import { stockTransferKeys } from "@/modules/inventory-management/stock-transfers/queries";
import { tenantKeys } from "@/modules/users-management/tenants/queries";

async function invalidatePeriodLock(queryClient: ReturnType<typeof useQueryClient>) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: periodLockKeys.all }),
    queryClient.invalidateQueries({ queryKey: tenantKeys.all }),
    queryClient.invalidateQueries({ queryKey: stockAdjustmentKeys.all }),
    queryClient.invalidateQueries({ queryKey: stockTransferKeys.all }),
    queryClient.invalidateQueries({ queryKey: stockKeys.all }),
  ]);
}

export function usePreviewPeriodLock() {
  return useMutation({
    mutationFn: periodLockApi.preview,
  });
}

export function useUpdatePeriodLock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: periodLockApi.update,
    onSuccess: async () => {
      await invalidatePeriodLock(queryClient);
    },
  });
}
