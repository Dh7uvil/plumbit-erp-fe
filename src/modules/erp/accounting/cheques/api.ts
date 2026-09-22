import { z } from "zod";

import { DEFAULT_PAGE_SIZE } from "@/config/constants";
import {
  ChequeCreateRequestSchema,
  ChequeSchema,
  ChequeUpdateRequestSchema,
  type Cheque,
  type ChequeCreateRequest,
  type ChequeListParams,
  type ChequeUpdateRequest,
} from "@/modules/erp/accounting/cheques/schemas";
import { apiClient } from "@/shared/api/client";
import { ifMatchHeaders, postDocumentHeaders } from "@/shared/api/concurrency";

export const chequesApi = {
  list: async (params: ChequeListParams = {}) => {
    const result = await apiClient.getList<unknown>("/cheques", {
      params: {
        page: params.page ?? 1,
        page_size: params.page_size ?? DEFAULT_PAGE_SIZE,
        search: params.search,
        sort_by: params.sort_by,
        sort_order: params.sort_order,
        status: params.status,
        direction: params.direction,
        bank_account_id: params.bank_account_id,
        due_date_from: params.due_date_from,
        due_date_to: params.due_date_to,
      },
    });
    return { data: z.array(ChequeSchema).parse(result.data), meta: result.meta };
  },
  get: async (id: string): Promise<Cheque> =>
    ChequeSchema.parse(await apiClient.get(`/cheques/${id}`)),
  create: async (payload: ChequeCreateRequest): Promise<Cheque> =>
    ChequeSchema.parse(await apiClient.post("/cheques", ChequeCreateRequestSchema.parse(payload))),
  update: async (id: string, payload: ChequeUpdateRequest): Promise<Cheque> =>
    ChequeSchema.parse(
      await apiClient.patch(`/cheques/${id}`, ChequeUpdateRequestSchema.parse(payload), {
        headers: ifMatchHeaders(payload.version),
      }),
    ),
  delete: async (id: string, version: number): Promise<Cheque> =>
    ChequeSchema.parse(
      await apiClient.delete(`/cheques/${id}`, { headers: ifMatchHeaders(version) }),
    ),
  issue: async (id: string, version: number): Promise<Cheque> =>
    ChequeSchema.parse(
      await apiClient.post(`/cheques/${id}/issue`, {}, { headers: postDocumentHeaders(version) }),
    ),
  deposit: async (id: string, version: number): Promise<Cheque> =>
    ChequeSchema.parse(
      await apiClient.post(`/cheques/${id}/deposit`, {}, { headers: postDocumentHeaders(version) }),
    ),
  clear: async (id: string, version: number): Promise<Cheque> =>
    ChequeSchema.parse(
      await apiClient.post(`/cheques/${id}/clear`, {}, { headers: postDocumentHeaders(version) }),
    ),
  bounce: async (
    id: string,
    payload: { reason?: string | null; version: number },
  ): Promise<Cheque> =>
    ChequeSchema.parse(
      await apiClient.post(`/cheques/${id}/bounce`, payload, {
        headers: postDocumentHeaders(payload.version),
      }),
    ),
  cancel: async (
    id: string,
    payload: { reason?: string | null; version: number },
  ): Promise<Cheque> =>
    ChequeSchema.parse(
      await apiClient.post(`/cheques/${id}/cancel`, payload, {
        headers: ifMatchHeaders(payload.version),
      }),
    ),
};
