import {
  FxExposureSchema,
  FxRevaluationRunListSchema,
  FxRevaluationRunSchema,
  type FxExposure,
  type FxRevaluationRun,
} from "@/modules/erp/accounting/fx-revaluation/schemas";
import { apiClient } from "@/shared/api/client";
import { postDocumentHeaders } from "@/shared/api/concurrency";
import type { ListResponse } from "@/shared/api/envelope";
import { randomUuid } from "@/shared/lib/uuid";

export const fxRevaluationApi = {
  list: async (): Promise<ListResponse<FxRevaluationRun[]>> => {
    const result = await apiClient.getList<unknown>("/fx-revaluations", {
      params: { page: 1, page_size: 20 },
    });
    return { data: FxRevaluationRunListSchema.parse(result.data), meta: result.meta };
  },
  get: async (id: string): Promise<FxRevaluationRun> =>
    FxRevaluationRunSchema.parse(await apiClient.get(`/fx-revaluations/${id}`)),
  exposure: async (asOf: string): Promise<FxExposure> =>
    FxExposureSchema.parse(
      await apiClient.get("/fx-revaluations/exposure", { params: { as_of: asOf } }),
    ),
  run: async (asOf: string): Promise<FxRevaluationRun> =>
    FxRevaluationRunSchema.parse(
      await apiClient.post(
        "/fx-revaluations/run",
        { as_of: asOf },
        { headers: { "Idempotency-Key": randomUuid() } },
      ),
    ),
  reverse: async (id: string, version: number, reversalDate: string): Promise<FxRevaluationRun> =>
    FxRevaluationRunSchema.parse(
      await apiClient.post(
        `/fx-revaluations/${id}/reverse`,
        { reversal_date: reversalDate, version },
        { headers: postDocumentHeaders(version) },
      ),
    ),
};
