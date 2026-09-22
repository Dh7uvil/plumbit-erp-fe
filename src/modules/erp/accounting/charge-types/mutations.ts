import { useMutation, useQueryClient } from "@tanstack/react-query";

import { chargeTypesApi } from "./api";
import { chargeTypeKeys } from "./queries";
import type { ChargeTypeUpdateRequest } from "./schemas";

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
