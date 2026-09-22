import { z } from "zod";

import { DEFAULT_PAGE_SIZE } from "@/config/constants";
import {
  PaymentAllocationRecordSchema,
  VoucherCreateRequestSchema,
  VoucherListSchema,
  VoucherSchema,
  VoucherUpdateRequestSchema,
  type PaymentAllocationRecord,
  type Voucher,
  type VoucherCreateRequest,
  type VoucherListParams,
  type VoucherUpdateRequest,
} from "@/modules/erp/accounting/vouchers/schemas";
import { apiClient } from "@/shared/api/client";
import { ifMatchHeaders, postDocumentHeaders } from "@/shared/api/concurrency";
import type { ListResponse } from "@/shared/api/envelope";

export type VoucherWriteOptions = {
  version: number;
};

export const vouchersApi = {
  list: async (params: VoucherListParams = {}): Promise<ListResponse<Voucher[]>> => {
    const result = await apiClient.getList<unknown>("/vouchers", {
      params: {
        page: params.page ?? 1,
        page_size: params.page_size ?? DEFAULT_PAGE_SIZE,
        search: params.search,
        sort_by: params.sort_by,
        sort_order: params.sort_order,
        status: params.status,
        voucher_type: params.voucher_type,
        party_id: params.party_id,
        currency_id: params.currency_id,
        payment_method: params.payment_method,
        voucher_date_from: params.voucher_date_from,
        voucher_date_to: params.voucher_date_to,
      },
    });
    return { ...result, data: VoucherListSchema.parse(result.data) };
  },
  get: async (id: string): Promise<Voucher> =>
    VoucherSchema.parse(await apiClient.get(`/vouchers/${id}`)),
  create: async (payload: VoucherCreateRequest): Promise<Voucher> =>
    VoucherSchema.parse(
      await apiClient.post("/vouchers", VoucherCreateRequestSchema.parse(payload)),
    ),
  update: async (
    id: string,
    payload: VoucherUpdateRequest,
    options: VoucherWriteOptions,
  ): Promise<Voucher> =>
    VoucherSchema.parse(
      await apiClient.patch(`/vouchers/${id}`, VoucherUpdateRequestSchema.parse(payload), {
        headers: ifMatchHeaders(options.version),
      }),
    ),
  delete: async (id: string, options: VoucherWriteOptions): Promise<Voucher> =>
    VoucherSchema.parse(
      await apiClient.delete(`/vouchers/${id}`, {
        headers: ifMatchHeaders(options.version),
      }),
    ),
  post: async (id: string, options: VoucherWriteOptions): Promise<Voucher> =>
    VoucherSchema.parse(
      await apiClient.post(
        `/vouchers/${id}/post`,
        {},
        {
          headers: postDocumentHeaders(options.version),
        },
      ),
    ),
  cancel: async (
    id: string,
    payload: { reason?: string | null; version: number },
  ): Promise<Voucher> =>
    VoucherSchema.parse(
      await apiClient.post(
        `/vouchers/${id}/cancel`,
        { reason: payload.reason ?? null, version: payload.version },
        { headers: postDocumentHeaders(payload.version) },
      ),
    ),
  allocations: async (id: string): Promise<PaymentAllocationRecord[]> => {
    const rows = await apiClient.get<unknown[]>(`/vouchers/${id}/allocations`);
    return z.array(PaymentAllocationRecordSchema).parse(rows);
  },
};
