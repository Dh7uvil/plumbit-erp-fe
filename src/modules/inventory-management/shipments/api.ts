import { DEFAULT_PAGE_SIZE } from "@/config/constants";
import {
  ShipmentCreateRequestSchema,
  ShipmentListSchema,
  ShipmentSchema,
  ShipmentTrackingUpdateSchema,
  ShipmentUpdateRequestSchema,
  type Shipment,
  type ShipmentCreateRequest,
  type ShipmentListParams,
  type ShipmentTrackingUpdate,
  type ShipmentUpdateRequest,
} from "@/modules/inventory-management/shipments/schemas";
import { apiClient } from "@/shared/api/client";
import { ifMatchHeaders } from "@/shared/api/concurrency";
import type { ListResponse } from "@/shared/api/envelope";

export type ShipmentWriteOptions = { version: number };

export const shipmentsApi = {
  list: async (params: ShipmentListParams = {}): Promise<ListResponse<Shipment[]>> => {
    const result = await apiClient.getList<unknown>("/shipments", {
      params: {
        page: params.page ?? 1,
        page_size: params.page_size ?? DEFAULT_PAGE_SIZE,
        search: params.search,
        sort_by: params.sort_by,
        sort_order: params.sort_order,
        status: params.status,
        shipment_type: params.shipment_type,
        transport_mode: params.transport_mode,
      },
    });
    return { data: ShipmentListSchema.parse(result.data), meta: result.meta };
  },
  get: async (id: string): Promise<Shipment> =>
    ShipmentSchema.parse(await apiClient.get(`/shipments/${id}`)),
  create: async (values: ShipmentCreateRequest): Promise<Shipment> =>
    ShipmentSchema.parse(
      await apiClient.post("/shipments", ShipmentCreateRequestSchema.parse(values)),
    ),
  update: async (
    id: string,
    values: ShipmentUpdateRequest,
    options: ShipmentWriteOptions,
  ): Promise<Shipment> =>
    ShipmentSchema.parse(
      await apiClient.patch(
        `/shipments/${id}`,
        ShipmentUpdateRequestSchema.parse({ ...values, version: options.version }),
        { headers: ifMatchHeaders(options.version) },
      ),
    ),
  dispatch: async (id: string, options: ShipmentWriteOptions): Promise<Shipment> =>
    ShipmentSchema.parse(
      await apiClient.post(`/shipments/${id}/dispatch`, undefined, {
        headers: ifMatchHeaders(options.version),
      }),
    ),
  arrive: async (id: string, options: ShipmentWriteOptions): Promise<Shipment> =>
    ShipmentSchema.parse(
      await apiClient.post(`/shipments/${id}/arrive`, undefined, {
        headers: ifMatchHeaders(options.version),
      }),
    ),
  close: async (id: string, options: ShipmentWriteOptions): Promise<Shipment> =>
    ShipmentSchema.parse(
      await apiClient.post(`/shipments/${id}/close`, undefined, {
        headers: ifMatchHeaders(options.version),
      }),
    ),
  cancel: async (id: string, options: ShipmentWriteOptions): Promise<Shipment> =>
    ShipmentSchema.parse(
      await apiClient.post(`/shipments/${id}/cancel`, undefined, {
        headers: ifMatchHeaders(options.version),
      }),
    ),
  updateTracking: async (
    id: string,
    values: ShipmentTrackingUpdate,
    options: ShipmentWriteOptions,
  ): Promise<Shipment> =>
    ShipmentSchema.parse(
      await apiClient.patch(
        `/shipments/${id}/tracking`,
        ShipmentTrackingUpdateSchema.parse({ ...values, version: options.version }),
        { headers: ifMatchHeaders(options.version) },
      ),
    ),
  attachDeliveryNotes: async (id: string, deliveryNoteIds: string[]): Promise<Shipment> =>
    ShipmentSchema.parse(
      await apiClient.post(`/shipments/${id}/delivery-notes`, {
        delivery_note_ids: deliveryNoteIds,
      }),
    ),
  detachDeliveryNote: async (id: string, noteId: string): Promise<Shipment> =>
    ShipmentSchema.parse(await apiClient.delete(`/shipments/${id}/delivery-notes/${noteId}`)),
  delete: async (id: string, options: ShipmentWriteOptions): Promise<Shipment> =>
    ShipmentSchema.parse(
      await apiClient.delete(`/shipments/${id}`, { headers: ifMatchHeaders(options.version) }),
    ),
};
