import { useQuery } from "@tanstack/react-query";

import { costSheetsApi } from "@/modules/erp/cost-sheets/api";
import type { CostSheetListParams } from "@/modules/erp/cost-sheets/schemas";

export const costSheetKeys = {
  all: ["cost-sheets"] as const,
  list: (params: CostSheetListParams) => [...costSheetKeys.all, "list", params] as const,
  detail: (id: string) => [...costSheetKeys.all, "detail", id] as const,
};

export function useCostSheets(params: CostSheetListParams = {}) {
  return useQuery({
    queryKey: costSheetKeys.list(params),
    queryFn: () => costSheetsApi.list(params),
  });
}

export function useCostSheet(id: string | undefined) {
  return useQuery({
    queryKey: costSheetKeys.detail(id ?? ""),
    queryFn: () => costSheetsApi.get(id!),
    enabled: Boolean(id),
  });
}
