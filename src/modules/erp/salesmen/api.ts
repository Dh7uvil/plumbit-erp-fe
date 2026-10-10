import { z } from "zod";

import {
  SalesmanOverviewListSchema,
  SalesmanOverviewRowSchema,
  SalesmanTargetsUpdateSchema,
  type SalesmanOverviewRow,
} from "@/modules/erp/salesmen/schemas";
import { apiClient } from "@/shared/api/client";

export const salesmenApi = {
  list: async (fiscalYear?: number): Promise<SalesmanOverviewRow[]> =>
    SalesmanOverviewListSchema.parse(
      await apiClient.get("/salesmen", {
        params: fiscalYear ? { fiscal_year: fiscalYear } : undefined,
      }),
    ),
  updateTargets: async (
    employeeId: string,
    payload: z.infer<typeof SalesmanTargetsUpdateSchema>,
  ): Promise<SalesmanOverviewRow> =>
    SalesmanOverviewRowSchema.parse(
      await apiClient.put(
        `/salesmen/${employeeId}/targets`,
        SalesmanTargetsUpdateSchema.parse(payload),
      ),
    ),
};
