import { DEFAULT_PAGE_SIZE } from "@/config/constants";
import {
  StockBalanceListSchema,
  StockBalanceSchema,
  StockMovementListSchema,
  StockReorderUpdateSchema,
  type StockBalance,
  type StockListParams,
  type StockMovement,
  type StockMovementListParams,
  type StockReorderUpdate,
} from "@/modules/inventory-management/stock/schemas";
import { apiClient } from "@/shared/api/client";
import type { ListResponse } from "@/shared/api/envelope";

export const stockApi = {
  list: async (params: StockListParams = {}): Promise<ListResponse<StockBalance[]>> => {
    const result = await apiClient.getList<unknown>("/stock", {
      params: {
        page: params.page ?? 1,
        page_size: params.page_size ?? DEFAULT_PAGE_SIZE,
        search: params.search,
        sort_by: params.sort_by,
        sort_order: params.sort_order,
        warehouse_id: params.warehouse_id,
        product_id: params.product_id,
        category_id: params.category_id,
        negative_only: params.negative_only,
        below_reorder: params.below_reorder,
      },
    });
    return { data: StockBalanceListSchema.parse(result.data), meta: result.meta };
  },
  listMovements: async (
    params: StockMovementListParams = {},
  ): Promise<ListResponse<StockMovement[]>> => {
    const result = await apiClient.getList<unknown>("/stock-movements", {
      params: {
        page: params.page ?? 1,
        page_size: params.page_size ?? DEFAULT_PAGE_SIZE,
        search: params.search,
        sort_by: params.sort_by,
        sort_order: params.sort_order,
        warehouse_id: params.warehouse_id,
        product_id: params.product_id,
        category_id: params.category_id,
        movement_type: params.movement_type,
        source_type: params.source_type,
        source_id: params.source_id,
        document_date_from: params.document_date_from,
        document_date_to: params.document_date_to,
      },
    });
    return { data: StockMovementListSchema.parse(result.data), meta: result.meta };
  },
  updateReorder: async (balanceId: string, values: StockReorderUpdate): Promise<StockBalance> =>
    StockBalanceSchema.parse(
      await apiClient.patch(`/stock/${balanceId}/reorder`, StockReorderUpdateSchema.parse(values)),
    ),
};
