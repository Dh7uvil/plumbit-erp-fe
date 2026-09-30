import { useQuery } from "@tanstack/react-query";

import { grnChargeAdjustmentsApi } from "@/modules/inventory-management/goods-receipt-charge-adjustments/api";
import type { GrnChargeAdjustmentListParams } from "@/modules/inventory-management/goods-receipt-charge-adjustments/schemas";

export function grnChargeAdjustmentKeys() {
  return {
    all: ["grn-charge-adjustments"] as const,
    lists: () => [...grnChargeAdjustmentKeys().all, "list"] as const,
    list: (params: GrnChargeAdjustmentListParams) =>
      [...grnChargeAdjustmentKeys().lists(), params] as const,
    details: () => [...grnChargeAdjustmentKeys().all, "detail"] as const,
    detail: (id: string) => [...grnChargeAdjustmentKeys().details(), id] as const,
  };
}

export function useGrnChargeAdjustments(params: GrnChargeAdjustmentListParams = {}) {
  return useQuery({
    queryKey: grnChargeAdjustmentKeys().list(params),
    queryFn: () => grnChargeAdjustmentsApi.list(params),
  });
}

export function useGrnChargeAdjustment(id: string) {
  return useQuery({
    queryKey: grnChargeAdjustmentKeys().detail(id),
    queryFn: () => grnChargeAdjustmentsApi.get(id),
    enabled: Boolean(id),
  });
}
