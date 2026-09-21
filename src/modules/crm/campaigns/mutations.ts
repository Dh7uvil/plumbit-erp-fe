"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { campaignsApi } from "@/modules/crm/campaigns/api";
import { campaignKeys } from "@/modules/crm/campaigns/queries";
import type {
  CampaignMemberCreateRequest,
  CampaignMemberUpdateRequest,
} from "@/modules/crm/campaigns/schemas";

async function invalidateCampaigns(queryClient: ReturnType<typeof useQueryClient>, id?: string) {
  await queryClient.invalidateQueries({ queryKey: campaignKeys.all });
  if (id) {
    await queryClient.invalidateQueries({ queryKey: campaignKeys.detail(id) });
  }
}

export function useCreateCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: campaignsApi.create,
    onSuccess: async () => {
      await invalidateCampaigns(queryClient);
    },
  });
}

export function useUpdateCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      values,
    }: {
      id: string;
      values: Parameters<typeof campaignsApi.update>[1];
    }) => campaignsApi.update(id, values),
    onSuccess: async (_data, { id }) => {
      await invalidateCampaigns(queryClient, id);
    },
  });
}

export function useDeleteCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: campaignsApi.delete,
    onSuccess: async () => {
      await invalidateCampaigns(queryClient);
    },
  });
}

export function useAddCampaignMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: CampaignMemberCreateRequest }) =>
      campaignsApi.addMember(id, values),
    onSuccess: async (_data, { id }) => {
      await invalidateCampaigns(queryClient, id);
    },
  });
}

export function useUpdateCampaignMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      memberId,
      values,
    }: {
      id: string;
      memberId: string;
      values: CampaignMemberUpdateRequest;
    }) => campaignsApi.updateMember(id, memberId, values),
    onSuccess: async (_data, { id }) => {
      await invalidateCampaigns(queryClient, id);
    },
  });
}

export function useRemoveCampaignMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, memberId }: { id: string; memberId: string }) =>
      campaignsApi.removeMember(id, memberId),
    onSuccess: async (_data, { id }) => {
      await invalidateCampaigns(queryClient, id);
    },
  });
}
