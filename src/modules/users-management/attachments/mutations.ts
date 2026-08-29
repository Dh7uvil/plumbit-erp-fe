"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { attachmentsApi } from "@/modules/users-management/attachments/api";
import { attachmentKeys } from "@/modules/users-management/attachments/queries";

export function useCreateAttachment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: attachmentsApi.create,
    onSuccess: async (_data, values) => {
      await queryClient.invalidateQueries({ queryKey: attachmentKeys.all });
      await queryClient.invalidateQueries({
        queryKey: attachmentKeys.forEntity(values.entity_type, values.entity_id),
      });
    },
  });
}

export function useDeleteAttachment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: attachmentsApi.delete,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: attachmentKeys.all });
    },
  });
}
