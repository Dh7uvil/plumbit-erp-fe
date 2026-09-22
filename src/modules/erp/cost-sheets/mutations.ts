import { useMutation, useQueryClient } from "@tanstack/react-query";

import { costSheetsApi, type CostSheetWriteOptions } from "@/modules/erp/cost-sheets/api";
import { costSheetKeys } from "@/modules/erp/cost-sheets/queries";
import type {
  CostSheetCreateRequest,
  CostSheetUpdateRequest,
} from "@/modules/erp/cost-sheets/schemas";

export function useCreateCostSheet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: CostSheetCreateRequest) => costSheetsApi.create(values),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: costSheetKeys.all });
    },
  });
}

export function useUpdateCostSheet(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { values: CostSheetUpdateRequest; options: CostSheetWriteOptions }) =>
      costSheetsApi.update(id, payload.values, payload.options),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: costSheetKeys.all });
      queryClient.setQueryData(costSheetKeys.detail(id), data);
    },
  });
}

export function useDeleteCostSheet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { id: string; options: CostSheetWriteOptions }) =>
      costSheetsApi.delete(payload.id, payload.options),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: costSheetKeys.all });
    },
  });
}

export function useConfirmCostSheet(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (options: CostSheetWriteOptions) => costSheetsApi.confirm(id, options),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: costSheetKeys.all });
      queryClient.setQueryData(costSheetKeys.detail(id), data);
    },
  });
}

export function useCloseCostSheet(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (options: CostSheetWriteOptions) => costSheetsApi.close(id, options),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: costSheetKeys.all });
      queryClient.setQueryData(costSheetKeys.detail(id), data);
    },
  });
}

export function useReopenCostSheet(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (options: CostSheetWriteOptions) => costSheetsApi.reopen(id, options),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: costSheetKeys.all });
      queryClient.setQueryData(costSheetKeys.detail(id), data);
    },
  });
}

export function usePullCostSheetActuals(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (options: CostSheetWriteOptions) => costSheetsApi.pullActuals(id, options),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: costSheetKeys.all });
      queryClient.setQueryData(costSheetKeys.detail(id), data);
    },
  });
}

export function useCreateLandedCostFromSheet(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (options: CostSheetWriteOptions) => costSheetsApi.createLandedCost(id, options),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: costSheetKeys.all });
      void queryClient.invalidateQueries({ queryKey: costSheetKeys.detail(id) });
    },
  });
}
