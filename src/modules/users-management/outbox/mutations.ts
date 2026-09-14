"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { outboxApi } from "@/modules/users-management/outbox/api";
import { outboxKeys } from "@/modules/users-management/outbox/queries";

export function useRetryOutboxEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => outboxApi.retry(id),
    onSuccess: async (_result, id) => {
      await queryClient.invalidateQueries({ queryKey: outboxKeys.all });
      await queryClient.invalidateQueries({ queryKey: outboxKeys.detail(id) });
    },
  });
}
