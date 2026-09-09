"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { goodsReceiptKeys } from "@/modules/inventory-management/goods-receipts/queries";
import { qualityInspectionsApi } from "@/modules/inventory-management/quality-inspections/api";
import { qualityInspectionKeys } from "@/modules/inventory-management/quality-inspections/queries";
import { stockKeys } from "@/modules/inventory-management/stock/queries";
import { isApiError } from "@/shared/api/errors";

type WriteVars = { id: string; version: number };

async function invalidateInspections(
  queryClient: ReturnType<typeof useQueryClient>,
  id?: string,
  stockMoved = false,
) {
  await queryClient.invalidateQueries({ queryKey: qualityInspectionKeys.all });
  if (id) {
    await queryClient.invalidateQueries({ queryKey: qualityInspectionKeys.detail(id) });
  }
  await queryClient.invalidateQueries({ queryKey: goodsReceiptKeys.all });
  if (stockMoved) {
    await queryClient.invalidateQueries({ queryKey: stockKeys.all });
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
  await queryClient.invalidateQueries({ queryKey: qualityInspectionKeys.detail(id) });
}

export function useCreateQualityInspection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: qualityInspectionsApi.create,
    onSuccess: async () => {
      await invalidateInspections(queryClient);
    },
  });
}

export function useUpdateQualityInspection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      values,
      version,
    }: {
      id: string;
      values: Parameters<typeof qualityInspectionsApi.update>[1];
      version: number;
    }) => qualityInspectionsApi.update(id, values, { version }),
    onSuccess: async (_data, { id }) => {
      await invalidateInspections(queryClient, id);
    },
    onError: async (error, { id }) => {
      await refetchIfStale(queryClient, error, id);
    },
  });
}

export function useApproveQualityInspection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, version }: WriteVars) => qualityInspectionsApi.approve(id, { version }),
    onSuccess: async (_data, { id }) => {
      await invalidateInspections(queryClient, id, true);
    },
    onError: async (error, { id }) => {
      await refetchIfStale(queryClient, error, id);
    },
  });
}

export function useCancelQualityInspection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, version, reason }: WriteVars & { reason?: string | null }) =>
      qualityInspectionsApi.cancel(id, { version, reason }),
    onSuccess: async (_data, { id }) => {
      await invalidateInspections(queryClient, id);
    },
    onError: async (error, { id }) => {
      await refetchIfStale(queryClient, error, id);
    },
  });
}

export function useDeleteQualityInspection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, version }: WriteVars) => qualityInspectionsApi.delete(id, { version }),
    onSuccess: async (_data, { id }) => {
      await invalidateInspections(queryClient, id);
    },
    onError: async (error, { id }) => {
      await refetchIfStale(queryClient, error, id);
    },
  });
}
