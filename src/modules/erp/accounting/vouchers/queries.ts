"use client";

import { useQuery } from "@tanstack/react-query";

import { vouchersApi } from "@/modules/erp/accounting/vouchers/api";
import type { VoucherListParams } from "@/modules/erp/accounting/vouchers/schemas";
import { useTenantQueryKey } from "@/shared/hooks/use-tenant-query-key";

export const voucherKeys = {
  all: ["vouchers"] as const,
  list: (params: VoucherListParams) => [...voucherKeys.all, "list", params] as const,
  detail: (id: string) => [...voucherKeys.all, "detail", id] as const,
  allocations: (id: string) => [...voucherKeys.all, "allocations", id] as const,
};

export function useVouchers(params: VoucherListParams) {
  return useQuery({
    queryKey: useTenantQueryKey(voucherKeys.list(params)),
    queryFn: () => vouchersApi.list(params),
  });
}

export function useVoucher(id: string | undefined) {
  return useQuery({
    queryKey: useTenantQueryKey(voucherKeys.detail(id ?? "")),
    queryFn: () => vouchersApi.get(id!),
    enabled: Boolean(id),
  });
}

export function useVoucherAllocations(id: string | undefined, enabled = true) {
  return useQuery({
    queryKey: useTenantQueryKey(voucherKeys.allocations(id ?? "")),
    queryFn: () => vouchersApi.allocations(id!),
    enabled: Boolean(id) && enabled,
  });
}
