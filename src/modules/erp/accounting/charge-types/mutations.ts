import { useMutation, useQueryClient } from "@tanstack/react-query";

import { chargeTypesApi } from "./api";
import { chargeTypeKeys } from "./queries";
import type { ChargeTypeCreateRequest, ChargeTypeUpdateRequest } from "./schemas";

export function useCreateChargeType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ChargeTypeCreateRequest) => chargeTypesApi.create(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: chargeTypeKeys.all });
    },
  });
}

export function useUpdateChargeType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ChargeTypeUpdateRequest }) =>
      chargeTypesApi.update(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: chargeTypeKeys.all });
    },
  });
}

export function useDeleteChargeType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => chargeTypesApi.delete(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: chargeTypeKeys.all });
    },
  });
}
