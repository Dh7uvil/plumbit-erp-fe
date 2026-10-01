"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { communicationSettingsApi } from "@/modules/communication/settings/api";
import { communicationSettingsKeys } from "@/modules/communication/settings/queries";
import type { ChatNotificationSettingsUpdate } from "@/modules/communication/settings/schemas";
import { useTenantQueryKey } from "@/shared/hooks/use-tenant-query-key";

export function useUpdateCommunicationSettings() {
  const queryClient = useQueryClient();
  const queryKey = useTenantQueryKey(communicationSettingsKeys.notifications());

  return useMutation({
    mutationFn: (values: ChatNotificationSettingsUpdate) => communicationSettingsApi.update(values),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKey, data);
    },
  });
}
