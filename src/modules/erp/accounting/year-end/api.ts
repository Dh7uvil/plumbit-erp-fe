import {
  YearEndCommitRequestSchema,
  YearEndPreviewSchema,
  YearEndStateSchema,
  type YearEndPreview,
  type YearEndState,
} from "@/modules/erp/accounting/year-end/schemas";
import { apiClient } from "@/shared/api/client";
import { randomUuid } from "@/shared/lib/uuid";

export const yearEndApi = {
  getState: async (fiscalYear: number): Promise<YearEndState> =>
    YearEndStateSchema.parse(
      await apiClient.get("/year-end/state", { params: { fiscal_year: fiscalYear } }),
    ),
  preview: async (fiscalYear: number): Promise<YearEndPreview> =>
    YearEndPreviewSchema.parse(
      await apiClient.post(
        "/year-end/preview",
        YearEndCommitRequestSchema.parse({ fiscal_year: fiscalYear }),
      ),
    ),
  commit: async (fiscalYear: number): Promise<YearEndState> =>
    YearEndStateSchema.parse(
      await apiClient.post(
        "/year-end/commit",
        YearEndCommitRequestSchema.parse({ fiscal_year: fiscalYear }),
        { headers: { "Idempotency-Key": randomUuid() } },
      ),
    ),
  reopen: async (fiscalYear: number): Promise<YearEndState> =>
    YearEndStateSchema.parse(
      await apiClient.post(
        "/year-end/reopen",
        YearEndCommitRequestSchema.parse({ fiscal_year: fiscalYear }),
      ),
    ),
};
