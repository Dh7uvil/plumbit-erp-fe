"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { attachmentsApi } from "@/modules/users-management/attachments/api";
import type { AttachmentListParams } from "@/modules/users-management/attachments/schemas";
import { useTenantQueryKey } from "@/shared/hooks/use-tenant-query-key";

export const attachmentKeys = {
  all: ["attachments"] as const,
  list: (params: AttachmentListParams) => [...attachmentKeys.all, "list", params] as const,
  forEntity: (entityType: string, entityId: string) =>
    [...attachmentKeys.all, "entity", entityType, entityId] as const,
  detail: (id: string) => [...attachmentKeys.all, "detail", id] as const,
};

export function useAttachments(params: AttachmentListParams, enabled = true) {
  return useQuery({
    queryKey: useTenantQueryKey(attachmentKeys.list(params)),
    queryFn: () => attachmentsApi.list(params),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useEntityAttachments(
  entityType: AttachmentListParams["entity_type"],
  entityId: string | null,
  enabled = true,
) {
  return useQuery({
    queryKey: useTenantQueryKey(attachmentKeys.forEntity(entityType, entityId ?? "")),
    queryFn: () => attachmentsApi.listAll({ entity_type: entityType, entity_id: entityId! }),
    enabled: enabled && Boolean(entityId),
  });
}
