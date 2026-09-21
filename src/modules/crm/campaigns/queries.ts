"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { campaignsApi } from "@/modules/crm/campaigns/api";
import type { CampaignListParams } from "@/modules/crm/campaigns/schemas";
import { useTenantQueryKey } from "@/shared/hooks/use-tenant-query-key";

export const campaignKeys = {
  all: ["campaigns"] as const,
  list: (params: CampaignListParams) => [...campaignKeys.all, "list", params] as const,
  allItems: () => [...campaignKeys.all, "all"] as const,
  detail: (id: string) => [...campaignKeys.all, "detail", id] as const,
  members: (id: string, params: { page?: number; page_size?: number }) =>
    [...campaignKeys.detail(id), "members", params] as const,
  roi: (id: string) => [...campaignKeys.detail(id), "roi"] as const,
};

export function useCampaigns(params: CampaignListParams) {
  return useQuery({
    queryKey: useTenantQueryKey(campaignKeys.list(params)),
    queryFn: () => campaignsApi.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useAllCampaigns(enabled = true) {
  return useQuery({
    queryKey: useTenantQueryKey(campaignKeys.allItems()),
    queryFn: campaignsApi.listAll,
    enabled,
  });
}

export function useCampaign(id: string | null) {
  return useQuery({
    queryKey: useTenantQueryKey(campaignKeys.detail(id ?? "")),
    queryFn: () => campaignsApi.get(id!),
    enabled: Boolean(id),
  });
}

export function useCampaignMembers(
  id: string | null,
  params: { page?: number; page_size?: number } = {},
) {
  return useQuery({
    queryKey: useTenantQueryKey(campaignKeys.members(id ?? "", params)),
    queryFn: () => campaignsApi.listMembers(id!, params),
    enabled: Boolean(id),
    placeholderData: keepPreviousData,
  });
}

export function useCampaignRoi(id: string | null, enabled = true) {
  return useQuery({
    queryKey: useTenantQueryKey(campaignKeys.roi(id ?? "")),
    queryFn: () => campaignsApi.roi(id!),
    enabled: enabled && Boolean(id),
  });
}
