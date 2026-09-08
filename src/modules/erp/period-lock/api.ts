import {
  PeriodLockPreviewSchema,
  PeriodLockSchema,
  PeriodLockUpdateSchema,
  type PeriodLock,
  type PeriodLockPreview,
  type PeriodLockPreviewParams,
  type PeriodLockUpdate,
} from "@/modules/erp/period-lock/schemas";
import { apiClient } from "@/shared/api/client";

export const periodLockApi = {
  get: async (): Promise<PeriodLock> => PeriodLockSchema.parse(await apiClient.get("/period-lock")),
  preview: async (params: PeriodLockPreviewParams = {}): Promise<PeriodLockPreview> =>
    PeriodLockPreviewSchema.parse(
      await apiClient.get("/period-lock/preview", {
        params: {
          lock_date: params.lock_date,
          hard_lock_date: params.hard_lock_date,
        },
      }),
    ),
  update: async (values: PeriodLockUpdate): Promise<PeriodLock> =>
    PeriodLockSchema.parse(
      await apiClient.patch("/period-lock", PeriodLockUpdateSchema.parse(values)),
    ),
};
