import { useQuery } from "@tanstack/react-query";

import { fetchGlIntegrity } from "@/modules/erp/accounting/integrity/api";

export const integrityKeys = {
  all: ["erp", "gl-integrity"] as const,
  scan: (asOf: string) => [...integrityKeys.all, asOf] as const,
};

export function useGlIntegrity(asOf: string) {
  return useQuery({
    queryKey: integrityKeys.scan(asOf),
    queryFn: () => fetchGlIntegrity(asOf),
    enabled: Boolean(asOf),
  });
}
