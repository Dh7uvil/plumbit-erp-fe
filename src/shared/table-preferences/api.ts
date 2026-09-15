import { apiClient } from "@/shared/api/client";
import {
  TablePreferenceSchema,
  type TablePreference,
  type TablePreferenceUpdate,
} from "@/shared/table-preferences/schemas";

function pathFor(tableKey: string): string {
  return `/users/me/table-preferences/${tableKey}`;
}

export const tablePreferencesApi = {
  get: async (tableKey: string): Promise<TablePreference> =>
    TablePreferenceSchema.parse(await apiClient.get(pathFor(tableKey))),
  put: async (tableKey: string, values: TablePreferenceUpdate): Promise<TablePreference> =>
    TablePreferenceSchema.parse(await apiClient.put(pathFor(tableKey), values)),
  reset: async (tableKey: string): Promise<TablePreference> =>
    TablePreferenceSchema.parse(await apiClient.delete(pathFor(tableKey))),
};
