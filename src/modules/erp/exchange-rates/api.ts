import { DEFAULT_PAGE_SIZE } from "@/config/constants";
import {
  ExchangeRateListSchema,
  ExchangeRateResolveSchema,
  ExchangeRateSchema,
  ExchangeRateUpsertRequestSchema,
  type ExchangeRate,
  type ExchangeRateListParams,
  type ExchangeRateResolve,
  type ExchangeRateResolveParams,
  type ExchangeRateUpsertRequest,
} from "@/modules/erp/exchange-rates/schemas";
import { apiClient } from "@/shared/api/client";
import type { ListResponse } from "@/shared/api/envelope";

export const exchangeRatesApi = {
  list: async (params: ExchangeRateListParams = {}): Promise<ListResponse<ExchangeRate[]>> => {
    const result = await apiClient.getList<unknown>("/exchange-rates", {
      params: {
        page: params.page ?? 1,
        page_size: params.page_size ?? DEFAULT_PAGE_SIZE,
        effective_date: params.effective_date,
        sort_by: params.sort_by,
        sort_order: params.sort_order,
      },
    });
    return { data: ExchangeRateListSchema.parse(result.data), meta: result.meta };
  },
  listAll: async (params: ExchangeRateListParams = {}): Promise<ExchangeRate[]> => {
    const result = await exchangeRatesApi.list(params);
    return result.data;
  },
  upsert: async (values: ExchangeRateUpsertRequest): Promise<ExchangeRate> =>
    ExchangeRateSchema.parse(
      await apiClient.put("/exchange-rates", ExchangeRateUpsertRequestSchema.parse(values)),
    ),
  resolve: async (params: ExchangeRateResolveParams): Promise<ExchangeRateResolve> =>
    ExchangeRateResolveSchema.parse(
      await apiClient.get("/exchange-rates/resolve", {
        params: {
          from_currency_id: params.from_currency_id,
          on_date: params.on_date,
        },
      }),
    ),
};
