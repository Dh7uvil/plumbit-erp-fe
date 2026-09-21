"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { leadsApi } from "@/modules/crm/leads/api";
import { leadKeys } from "@/modules/crm/leads/queries";
import type { LeadConvertRequest, LeadStatus } from "@/modules/crm/leads/schemas";
import { customerKeys } from "@/modules/crm/customers/queries";
import { contactKeys } from "@/modules/crm/contacts/queries";
import { opportunityKeys } from "@/modules/crm/opportunities/queries";
import { isApiError } from "@/shared/api/errors";

async function invalidateLeads(queryClient: ReturnType<typeof useQueryClient>, id?: string) {
  await queryClient.invalidateQueries({ queryKey: leadKeys.all });
  if (id) {
    await queryClient.invalidateQueries({ queryKey: leadKeys.detail(id) });
  }
}

async function refetchIfStale(
  queryClient: ReturnType<typeof useQueryClient>,
  error: unknown,
  id?: string,
) {
  if (!id || !isApiError(error) || error.code !== "DOCUMENT_STALE") {
    return;
  }
  await queryClient.invalidateQueries({ queryKey: leadKeys.detail(id) });
}

export function useCreateLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: leadsApi.create,
    onSuccess: async () => {
      await invalidateLeads(queryClient);
    },
  });
}

export function useUpdateLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, version, ...values }: { id: string; version: number }) =>
      leadsApi.update(id, values, version),
    onSuccess: async (_data, variables) => {
      await invalidateLeads(queryClient, variables.id);
    },
    onError: async (error, variables) => {
      await refetchIfStale(queryClient, error, variables.id);
    },
  });
}

export function useDeleteLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => leadsApi.delete(id),
    onSuccess: async () => {
      await invalidateLeads(queryClient);
    },
  });
}

export function useAssignLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ownerId,
      version,
    }: {
      id: string;
      ownerId: string;
      version: number;
    }) => leadsApi.assign(id, ownerId, version),
    onSuccess: async (_data, variables) => {
      await invalidateLeads(queryClient, variables.id);
    },
    onError: async (error, variables) => {
      await refetchIfStale(queryClient, error, variables.id);
    },
  });
}

export function useConvertLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      version,
      ...values
    }: LeadConvertRequest & { id: string; version: number }) =>
      leadsApi.convert(id, values, version),
    onSuccess: async (data, variables) => {
      await invalidateLeads(queryClient, variables.id);
      await queryClient.invalidateQueries({ queryKey: customerKeys.all });
      await queryClient.invalidateQueries({ queryKey: contactKeys.all });
      await queryClient.invalidateQueries({ queryKey: opportunityKeys.all });
      if (data.opportunity_id) {
        await queryClient.invalidateQueries({
          queryKey: opportunityKeys.detail(data.opportunity_id),
        });
      }
    },
    onError: async (error, variables) => {
      await refetchIfStale(queryClient, error, variables.id);
    },
  });
}

export function useChangeLeadStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      status,
      version,
    }: {
      id: string;
      status: LeadStatus;
      version: number;
    }) => leadsApi.changeStatus(id, status, version),
    onSuccess: async (_data, variables) => {
      await invalidateLeads(queryClient, variables.id);
    },
    onError: async (error, variables) => {
      await refetchIfStale(queryClient, error, variables.id);
    },
  });
}
