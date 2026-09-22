import { useQuery } from "@tanstack/react-query";

import { chequesApi } from "@/modules/erp/accounting/cheques/api";
import type { ChequeListParams } from "@/modules/erp/accounting/cheques/schemas";

export const chequeKeys = {
  all: ["cheques"] as const,
  list: (params: ChequeListParams) => [...chequeKeys.all, "list", params] as const,
  detail: (id: string) => [...chequeKeys.all, "detail", id] as const,
};

export function useCheques(params: ChequeListParams = {}) {
  return useQuery({
    queryKey: chequeKeys.list(params),
    queryFn: () => chequesApi.list(params),
  });
}

export function useCheque(id: string) {
  return useQuery({
    queryKey: chequeKeys.detail(id),
    queryFn: () => chequesApi.get(id),
    enabled: Boolean(id),
  });
}
