import { DEFAULT_PAGE_SIZE } from "@/config/constants";
import {
  QualityInspectionCreateRequestSchema,
  QualityInspectionListSchema,
  QualityInspectionSchema,
  QualityInspectionUpdateRequestSchema,
  type QualityInspection,
  type QualityInspectionCreateRequest,
  type QualityInspectionListParams,
  type QualityInspectionUpdateRequest,
} from "@/modules/inventory-management/quality-inspections/schemas";
import { apiClient } from "@/shared/api/client";
import { ifMatchHeaders, postDocumentHeaders } from "@/shared/api/concurrency";
import type { ListResponse } from "@/shared/api/envelope";

export type QualityInspectionWriteOptions = {
  version: number;
};

export const qualityInspectionsApi = {
  list: async (
    params: QualityInspectionListParams = {},
  ): Promise<ListResponse<QualityInspection[]>> => {
    const result = await apiClient.getList<unknown>("/quality-inspections", {
      params: {
        page: params.page ?? 1,
        page_size: params.page_size ?? DEFAULT_PAGE_SIZE,
        search: params.search,
        sort_by: params.sort_by,
        sort_order: params.sort_order,
        status: params.status,
        goods_receipt_id: params.goods_receipt_id,
        inspection_date_from: params.inspection_date_from,
        inspection_date_to: params.inspection_date_to,
      },
    });
    return { data: QualityInspectionListSchema.parse(result.data), meta: result.meta };
  },
  get: async (id: string): Promise<QualityInspection> =>
    QualityInspectionSchema.parse(await apiClient.get(`/quality-inspections/${id}`)),
  create: async (values: QualityInspectionCreateRequest): Promise<QualityInspection> =>
    QualityInspectionSchema.parse(
      await apiClient.post(
        "/quality-inspections",
        QualityInspectionCreateRequestSchema.parse(values),
      ),
    ),
  update: async (
    id: string,
    values: QualityInspectionUpdateRequest,
    options: QualityInspectionWriteOptions,
  ): Promise<QualityInspection> =>
    QualityInspectionSchema.parse(
      await apiClient.patch(
        `/quality-inspections/${id}`,
        QualityInspectionUpdateRequestSchema.parse({ ...values, version: options.version }),
        { headers: ifMatchHeaders(options.version) },
      ),
    ),
  approve: async (id: string, options: QualityInspectionWriteOptions): Promise<QualityInspection> =>
    QualityInspectionSchema.parse(
      await apiClient.post(`/quality-inspections/${id}/approve`, undefined, {
        headers: postDocumentHeaders(options.version),
      }),
    ),
  cancel: async (
    id: string,
    options: QualityInspectionWriteOptions & { reason?: string | null },
  ): Promise<QualityInspection> =>
    QualityInspectionSchema.parse(
      await apiClient.post(
        `/quality-inspections/${id}/cancel`,
        { reason: options.reason ?? null, version: options.version },
        { headers: ifMatchHeaders(options.version) },
      ),
    ),
  delete: async (id: string, options: QualityInspectionWriteOptions): Promise<QualityInspection> =>
    QualityInspectionSchema.parse(
      await apiClient.delete(`/quality-inspections/${id}`, {
        headers: ifMatchHeaders(options.version),
      }),
    ),
};
