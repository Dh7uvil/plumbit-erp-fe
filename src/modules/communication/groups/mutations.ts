"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { conversationKeys } from "@/modules/communication/conversations/queries";
import { groupsApi } from "@/modules/communication/groups/api";
import type {
  GroupCreateRequest,
  GroupMembersAddRequest,
  GroupUpdateRequest,
} from "@/modules/communication/groups/schemas";
import {
  communicationQueryKey,
  invalidateConversationQueries,
} from "@/modules/communication/shared/tenant-query";
import { useTenantId } from "@/shared/hooks/use-tenant-query-key";

function useInvalidateGroupsAndConversations() {
  const queryClient = useQueryClient();
  const tenantId = useTenantId();
  return () => {
    invalidateConversationQueries(queryClient, tenantId);
    queryClient.invalidateQueries({
      queryKey: communicationQueryKey(["communication", "groups"], tenantId),
    });
  };
}

export function useCreateGroup() {
  const invalidate = useInvalidateGroupsAndConversations();
  return useMutation({
    mutationFn: (values: GroupCreateRequest) => groupsApi.create(values),
    onSuccess: () => invalidate(),
  });
}

export function useUpdateGroup() {
  const queryClient = useQueryClient();
  const tenantId = useTenantId();
  const invalidate = useInvalidateGroupsAndConversations();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: GroupUpdateRequest }) =>
      groupsApi.update(id, values),
    onSuccess: (group) => {
      queryClient.setQueryData(
        communicationQueryKey(conversationKeys.detail(group.id), tenantId),
        group,
      );
      invalidate();
    },
  });
}

export function useAddGroupMembers() {
  const invalidate = useInvalidateGroupsAndConversations();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: GroupMembersAddRequest }) =>
      groupsApi.addMembers(id, values),
    onSuccess: () => invalidate(),
  });
}

export function useRemoveGroupMember() {
  const invalidate = useInvalidateGroupsAndConversations();
  return useMutation({
    mutationFn: ({ id, userId }: { id: string; userId: string }) =>
      groupsApi.removeMember(id, userId),
    onSuccess: () => invalidate(),
  });
}

export function usePromoteGroupAdmin() {
  const invalidate = useInvalidateGroupsAndConversations();
  return useMutation({
    mutationFn: ({ id, userId }: { id: string; userId: string }) =>
      groupsApi.promoteAdmin(id, userId),
    onSuccess: () => invalidate(),
  });
}

export function useDemoteGroupAdmin() {
  const invalidate = useInvalidateGroupsAndConversations();
  return useMutation({
    mutationFn: ({ id, userId }: { id: string; userId: string }) =>
      groupsApi.demoteAdmin(id, userId),
    onSuccess: () => invalidate(),
  });
}

export function useLeaveGroup() {
  const invalidate = useInvalidateGroupsAndConversations();
  return useMutation({
    mutationFn: (id: string) => groupsApi.leave(id),
    onSuccess: () => invalidate(),
  });
}
