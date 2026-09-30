import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  grnChargeAdjustmentsApi,
  type GrnChargeAdjustmentWriteOptions,
} from "@/modules/inventory-management/goods-receipt-charge-adjustments/api";
import { grnChargeAdjustmentKeys } from "@/modules/inventory-management/goods-receipt-charge-adjustments/queries";
import type {
  GrnChargeAdjustmentCreateRequest,
  GrnChargeAdjustmentUpdateRequest,
} from "@/modules/inventory-management/goods-receipt-charge-adjustments/schemas";

export function useCreateGrnChargeAdjustment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: GrnChargeAdjustmentCreateRequest) =>
      grnChargeAdjustmentsApi.create(values),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: grnChargeAdjustmentKeys().all });
    },
  });
}

export function useUpdateGrnChargeAdjustment(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      values,
      options,
    }: {
      values: GrnChargeAdjustmentUpdateRequest;
      options: GrnChargeAdjustmentWriteOptions;
    }) => grnChargeAdjustmentsApi.update(id, values, options),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: grnChargeAdjustmentKeys().all });
    },
  });
}

export function usePostGrnChargeAdjustment(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (options: GrnChargeAdjustmentWriteOptions) =>
      grnChargeAdjustmentsApi.post(id, options),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: grnChargeAdjustmentKeys().all });
    },
  });
}

export function useDeleteGrnChargeAdjustment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, options }: { id: string; options: GrnChargeAdjustmentWriteOptions }) =>
      grnChargeAdjustmentsApi.delete(id, options),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: grnChargeAdjustmentKeys().all });
    },
  });
}
