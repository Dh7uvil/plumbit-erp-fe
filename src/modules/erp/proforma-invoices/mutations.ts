"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { proformaInvoicesApi } from "@/modules/erp/proforma-invoices/api";
import { proformaInvoiceKeys } from "@/modules/erp/proforma-invoices/queries";
import { quotationKeys } from "@/modules/erp/quotations/queries";
import { salesInvoiceKeys } from "@/modules/erp/sales-invoices/queries";
import { salesOrderKeys } from "@/modules/erp/sales-orders/queries";
import { isApiError } from "@/shared/api/errors";

type ProformaInvoiceWriteVars = { id: string; version: number };

async function invalidateProformaInvoices(
  queryClient: ReturnType<typeof useQueryClient>,
  id?: string,
) {
  await queryClient.invalidateQueries({ queryKey: proformaInvoiceKeys.all });
  if (id) {
    await queryClient.invalidateQueries({ queryKey: proformaInvoiceKeys.detail(id) });
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
  await queryClient.invalidateQueries({ queryKey: proformaInvoiceKeys.detail(id) });
}

export function useCreateProformaInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: proformaInvoicesApi.create,
    onSuccess: async () => {
      await invalidateProformaInvoices(queryClient);
    },
  });
}

export function useUpdateProformaInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      values,
      version,
    }: {
      id: string;
      values: Parameters<typeof proformaInvoicesApi.update>[1];
      version: number;
    }) => proformaInvoicesApi.update(id, values, { version }),
    onSuccess: async (_data, { id }) => {
      await invalidateProformaInvoices(queryClient, id);
    },
    onError: async (error, { id }) => {
      await refetchIfStale(queryClient, error, id);
    },
  });
}

function useProformaInvoiceVersionMutation(
  mutationFn: (
    id: string,
    options: { version: number },
  ) => ReturnType<typeof proformaInvoicesApi.send>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, version }: ProformaInvoiceWriteVars) => mutationFn(id, { version }),
    onSuccess: async (_data, { id }) => {
      await invalidateProformaInvoices(queryClient, id);
      await queryClient.invalidateQueries({ queryKey: quotationKeys.all });
    },
    onError: async (error, { id }) => {
      await refetchIfStale(queryClient, error, id);
    },
  });
}

export function useSendProformaInvoice() {
  return useProformaInvoiceVersionMutation(proformaInvoicesApi.send);
}

export function useConfirmProformaInvoice() {
  return useProformaInvoiceVersionMutation(proformaInvoicesApi.confirm);
}

export function useDeclineProformaInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, version, reason }: ProformaInvoiceWriteVars & { reason?: string | null }) =>
      proformaInvoicesApi.decline(id, { version, reason }),
    onSuccess: async (_data, { id }) => {
      await invalidateProformaInvoices(queryClient, id);
    },
    onError: async (error, { id }) => {
      await refetchIfStale(queryClient, error, id);
    },
  });
}

export function useCancelProformaInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, version, reason }: ProformaInvoiceWriteVars & { reason?: string | null }) =>
      proformaInvoicesApi.cancel(id, { version, reason }),
    onSuccess: async (_data, { id }) => {
      await invalidateProformaInvoices(queryClient, id);
    },
    onError: async (error, { id }) => {
      await refetchIfStale(queryClient, error, id);
    },
  });
}

export function useReopenProformaInvoice() {
  return useProformaInvoiceVersionMutation(proformaInvoicesApi.reopen);
}

export function useReviseProformaInvoice() {
  return useProformaInvoiceVersionMutation(proformaInvoicesApi.revise);
}

export function useCloneProformaInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: proformaInvoicesApi.clone,
    onSuccess: async () => {
      await invalidateProformaInvoices(queryClient);
    },
  });
}

export function useConvertProformaInvoiceToSalesOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      version,
      values,
    }: ProformaInvoiceWriteVars & {
      values?: Parameters<typeof proformaInvoicesApi.convertToSalesOrder>[1]["values"];
    }) => proformaInvoicesApi.convertToSalesOrder(id, { version, values }),
    onSuccess: async (_data, { id }) => {
      await invalidateProformaInvoices(queryClient, id);
      await queryClient.invalidateQueries({ queryKey: salesOrderKeys.all });
      await queryClient.invalidateQueries({ queryKey: quotationKeys.all });
    },
    onError: async (error, { id }) => {
      await refetchIfStale(queryClient, error, id);
    },
  });
}

export function useConvertProformaInvoiceToSalesInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      version,
      values,
    }: ProformaInvoiceWriteVars & {
      values?: Parameters<typeof proformaInvoicesApi.convertToSalesInvoice>[1]["values"];
    }) => proformaInvoicesApi.convertToSalesInvoice(id, { version, values }),
    onSuccess: async (_data, { id }) => {
      await invalidateProformaInvoices(queryClient, id);
      await queryClient.invalidateQueries({ queryKey: salesInvoiceKeys.all });
      await queryClient.invalidateQueries({ queryKey: quotationKeys.all });
    },
    onError: async (error, { id }) => {
      await refetchIfStale(queryClient, error, id);
    },
  });
}

export function useDeleteProformaInvoice() {
  return useProformaInvoiceVersionMutation(proformaInvoicesApi.delete);
}
