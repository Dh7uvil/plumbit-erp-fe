import { DEFAULT_PAGE_SIZE } from "@/config/constants";
import {
  PackageCreateRequestSchema,
  PackageListSchema,
  PackageSchema,
  PackageUpdateRequestSchema,
  type Package,
  type PackageCreateRequest,
  type PackageListParams,
  type PackageUpdateRequest,
} from "@/modules/inventory-management/packages/schemas";
import { apiClient } from "@/shared/api/client";
import { ifMatchHeaders } from "@/shared/api/concurrency";
import type { ListResponse } from "@/shared/api/envelope";

export type PackageWriteOptions = {
  version: number;
};

export const packagesApi = {
  list: async (params: PackageListParams = {}): Promise<ListResponse<Package[]>> => {
    const result = await apiClient.getList<unknown>("/packages", {
      params: {
        page: params.page ?? 1,
        page_size: params.page_size ?? DEFAULT_PAGE_SIZE,
        search: params.search,
        sort_by: params.sort_by,
        sort_order: params.sort_order,
        status: params.status,
        sales_order_id: params.sales_order_id,
        delivery_note_id: params.delivery_note_id,
      },
    });
    return { data: PackageListSchema.parse(result.data), meta: result.meta };
  },
  get: async (id: string): Promise<Package> =>
    PackageSchema.parse(await apiClient.get(`/packages/${id}`)),
  create: async (values: PackageCreateRequest): Promise<Package> =>
    PackageSchema.parse(await apiClient.post("/packages", PackageCreateRequestSchema.parse(values))),
  update: async (
    id: string,
    values: PackageUpdateRequest,
    options: PackageWriteOptions,
  ): Promise<Package> =>
    PackageSchema.parse(
      await apiClient.patch(
        `/packages/${id}`,
        PackageUpdateRequestSchema.parse({ ...values, version: options.version }),
        { headers: ifMatchHeaders(options.version) },
      ),
    ),
  pack: async (id: string, options: PackageWriteOptions): Promise<Package> =>
    PackageSchema.parse(
      await apiClient.post(`/packages/${id}/pack`, undefined, {
        headers: ifMatchHeaders(options.version),
      }),
    ),
  cancel: async (id: string, options: PackageWriteOptions): Promise<Package> =>
    PackageSchema.parse(
      await apiClient.post(`/packages/${id}/cancel`, undefined, {
        headers: ifMatchHeaders(options.version),
      }),
    ),
  delete: async (id: string, options: PackageWriteOptions): Promise<Package> =>
    PackageSchema.parse(
      await apiClient.delete(`/packages/${id}`, { headers: ifMatchHeaders(options.version) }),
    ),
};
