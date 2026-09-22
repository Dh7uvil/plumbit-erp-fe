"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { vouchersApi } from "@/modules/erp/accounting/vouchers/api";
import { voucherKeys } from "@/modules/erp/accounting/vouchers/queries";
import type {
  VoucherCreateRequest,
  VoucherUpdateRequest,
} from "@/modules/erp/accounting/vouchers/schemas";
import { useTenantQueryKey } from "@/shared/hooks/use-tenant-query-key";

export function useCreateVoucher() {
  const queryClient = useQueryClient();
  const baseKey = useTenantQueryKey(voucherKeys.all);
  return useMutation({
    mutationFn: (payload: VoucherCreateRequest) => vouchersApi.create(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: baseKey });
    },
  });
}

export function useUpdateVoucher(id: string) {
  const queryClient = useQueryClient();
  const baseKey = useTenantQueryKey(voucherKeys.all);
  return useMutation({
    mutationFn: (payload: VoucherUpdateRequest & { version: number }) =>
      vouchersApi.update(id, payload, { version: payload.version }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: baseKey });
    },
  });
}

export function useDeleteVoucher() {
  const queryClient = useQueryClient();
  const baseKey = useTenantQueryKey(voucherKeys.all);
  return useMutation({
    mutationFn: ({ id, version }: { id: string; version: number }) =>
      vouchersApi.delete(id, { version }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: baseKey });
    },
  });
}

export function usePostVoucher(id: string) {
  const queryClient = useQueryClient();
  const baseKey = useTenantQueryKey(voucherKeys.all);
  return useMutation({
    mutationFn: (version: number) => vouchersApi.post(id, { version }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: baseKey });
    },
  });
}

export function useCancelVoucher(id: string) {
  const queryClient = useQueryClient();
  const baseKey = useTenantQueryKey(voucherKeys.all);
  return useMutation({
    mutationFn: (payload: { reason?: string | null; version: number }) =>
      vouchersApi.cancel(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: baseKey });
    },
  });
}
