import { useMutation, useQueryClient } from "@tanstack/react-query";

import { chequesApi } from "@/modules/erp/accounting/cheques/api";
import { chequeKeys } from "@/modules/erp/accounting/cheques/queries";
import type {
  ChequeCreateRequest,
  ChequeUpdateRequest,
} from "@/modules/erp/accounting/cheques/schemas";

export function useCreateCheque() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ChequeCreateRequest) => chequesApi.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: chequeKeys.all }),
  });
}

export function useUpdateCheque() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ChequeUpdateRequest }) =>
      chequesApi.update(id, payload),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: chequeKeys.all });
      queryClient.invalidateQueries({ queryKey: chequeKeys.detail(id) });
    },
  });
}

export function useDeleteCheque() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, version }: { id: string; version: number }) =>
      chequesApi.delete(id, version),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: chequeKeys.all }),
  });
}

export function useChequeWorkflow() {
  const queryClient = useQueryClient();
  const invalidate = (id: string) => {
    queryClient.invalidateQueries({ queryKey: chequeKeys.all });
    queryClient.invalidateQueries({ queryKey: chequeKeys.detail(id) });
  };
  return {
    issue: useMutation({
      mutationFn: ({ id, version }: { id: string; version: number }) =>
        chequesApi.issue(id, version),
      onSuccess: (_, { id }) => invalidate(id),
    }),
    deposit: useMutation({
      mutationFn: ({ id, version }: { id: string; version: number }) =>
        chequesApi.deposit(id, version),
      onSuccess: (_, { id }) => invalidate(id),
    }),
    clear: useMutation({
      mutationFn: ({ id, version }: { id: string; version: number }) =>
        chequesApi.clear(id, version),
      onSuccess: (_, { id }) => invalidate(id),
    }),
    bounce: useMutation({
      mutationFn: ({
        id,
        payload,
      }: {
        id: string;
        payload: { reason?: string | null; version: number };
      }) => chequesApi.bounce(id, payload),
      onSuccess: (_, { id }) => invalidate(id),
    }),
    cancel: useMutation({
      mutationFn: ({
        id,
        payload,
      }: {
        id: string;
        payload: { reason?: string | null; version: number };
      }) => chequesApi.cancel(id, payload),
      onSuccess: (_, { id }) => invalidate(id),
    }),
  };
}
