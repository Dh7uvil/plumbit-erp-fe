"use client";

import { useMemo } from "react";

import { colleaguesApi } from "@/modules/communication/colleagues/api";
import { useTenantQueryKey } from "@/shared/hooks/use-tenant-query-key";
import { useQuery } from "@tanstack/react-query";

export function useUserDirectory() {
  const queryKey = useTenantQueryKey(["communication", "colleagues"]);
  const query = useQuery({
    queryKey,
    queryFn: () => colleaguesApi.list(),
    staleTime: 5 * 60_000,
  });

  const byId = useMemo(() => {
    const map = new Map<string, { id: string; name: string; email: string }>();
    for (const user of query.data ?? []) {
      map.set(user.id, { id: user.id, name: user.name, email: user.email });
    }
    return map;
  }, [query.data]);

  return {
    users: query.data ?? [],
    byId,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}

export function buildConversationUserNames(
  byId: Map<string, { id: string; name: string; email: string }>,
  me?: { id: string; name: string } | null,
): Map<string, string> {
  const map = new Map<string, string>();
  if (me) {
    map.set(me.id, me.name);
  }
  for (const [id, user] of byId) {
    map.set(id, user.name);
  }
  return map;
}
