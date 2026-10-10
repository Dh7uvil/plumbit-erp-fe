import { useQuery } from "@tanstack/react-query";

import { entryBooksApi } from "@/modules/erp/accounting/entry-books/api";
import { useTenantQueryKey } from "@/shared/hooks/use-tenant-query-key";

export function useEntryBooks() {
  const queryKey = useTenantQueryKey(["entry-books", "all"]);
  return useQuery({
    queryKey,
    queryFn: () => entryBooksApi.listAll(),
  });
}
