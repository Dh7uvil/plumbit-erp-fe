import { DEFAULT_PAGE_SIZE } from "@/config/constants";
import {
  DeliveryNoteCreateFromSalesOrderSchema,
  DeliveryNoteCreateRequestSchema,
  DeliveryNoteListSchema,
  DeliveryNoteSchema,
  DeliveryNoteUpdateRequestSchema,
  type DeliveryNote,
  type DeliveryNoteCreateFromSalesOrder,
  type DeliveryNoteCreateRequest,
  type DeliveryNoteListParams,
  type DeliveryNoteUpdateRequest,
} from "@/modules/inventory-management/delivery-notes/schemas";
import { apiClient } from "@/shared/api/client";
import { ifMatchHeaders, postDocumentHeaders } from "@/shared/api/concurrency";
import type { ListResponse } from "@/shared/api/envelope";
import { randomUuid } from "@/shared/lib/uuid";

export type DeliveryNoteWriteOptions = {
  version: number;
};

export const deliveryNotesApi = {
  list: async (params: DeliveryNoteListParams = {}): Promise<ListResponse<DeliveryNote[]>> => {
    const result = await apiClient.getList<unknown>("/delivery-notes", {
      params: {
        page: params.page ?? 1,
        page_size: params.page_size ?? DEFAULT_PAGE_SIZE,
        search: params.search,
        sort_by: params.sort_by,
        sort_order: params.sort_order,
        status: params.status,
        sales_order_id: params.sales_order_id,
        customer_id: params.customer_id,
        warehouse_id: params.warehouse_id,
        shipment_id: params.shipment_id,
        unshipped: params.unshipped,
        product_id: params.product_id,
        document_date_from: params.document_date_from,
        document_date_to: params.document_date_to,
      },
    });
    return { data: DeliveryNoteListSchema.parse(result.data), meta: result.meta };
  },
  get: async (id: string): Promise<DeliveryNote> =>
    DeliveryNoteSchema.parse(await apiClient.get(`/delivery-notes/${id}`)),
  create: async (values: DeliveryNoteCreateRequest): Promise<DeliveryNote> =>
    DeliveryNoteSchema.parse(
      await apiClient.post("/delivery-notes", DeliveryNoteCreateRequestSchema.parse(values)),
    ),
  createFromSalesOrder: async (
    values: DeliveryNoteCreateFromSalesOrder,
  ): Promise<DeliveryNote> =>
    DeliveryNoteSchema.parse(
      await apiClient.post(
        "/delivery-notes/from-sales-order",
        DeliveryNoteCreateFromSalesOrderSchema.parse(values),
        { headers: { "Idempotency-Key": randomUuid() } },
      ),
    ),
  update: async (
    id: string,
    values: DeliveryNoteUpdateRequest,
    options: DeliveryNoteWriteOptions,
  ): Promise<DeliveryNote> =>
    DeliveryNoteSchema.parse(
      await apiClient.patch(
        `/delivery-notes/${id}`,
        DeliveryNoteUpdateRequestSchema.parse({ ...values, version: options.version }),
        { headers: ifMatchHeaders(options.version) },
      ),
    ),
  post: async (id: string, options: DeliveryNoteWriteOptions): Promise<DeliveryNote> =>
    DeliveryNoteSchema.parse(
      await apiClient.post(`/delivery-notes/${id}/post`, undefined, {
        headers: postDocumentHeaders(options.version),
      }),
    ),
  cancel: async (
    id: string,
    options: DeliveryNoteWriteOptions & { reason?: string | null },
  ): Promise<DeliveryNote> =>
    DeliveryNoteSchema.parse(
      await apiClient.post(
        `/delivery-notes/${id}/cancel`,
        { reason: options.reason ?? null, version: options.version },
        { headers: postDocumentHeaders(options.version) },
      ),
    ),
  delete: async (id: string, options: DeliveryNoteWriteOptions): Promise<DeliveryNote> =>
    DeliveryNoteSchema.parse(
      await apiClient.delete(`/delivery-notes/${id}`, {
        headers: ifMatchHeaders(options.version),
      }),
    ),
  attachPackage: async (noteId: string, packageId: string) =>
    apiClient.post(`/delivery-notes/${noteId}/packages`, { package_id: packageId }),
  detachPackage: async (noteId: string, packageId: string) =>
    apiClient.delete(`/delivery-notes/${noteId}/packages/${packageId}`),
};
