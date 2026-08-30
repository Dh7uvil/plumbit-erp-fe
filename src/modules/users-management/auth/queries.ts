"use client";

import { useQuery, type QueryClient } from "@tanstack/react-query";

import { authApi } from "@/modules/users-management/auth/api";
import type { Me } from "@/modules/users-management/auth/schemas";

export const authKeys = {
  all: ["auth"] as const,
  me: () => [...authKeys.all, "me"] as const,
};

export function useMe(initialData?: Me | null) {
  return useQuery({
    queryKey: authKeys.me(),
    queryFn: authApi.me,
    initialData: initialData ?? undefined,
  });
}

export async function refetchCurrentUser(queryClient: QueryClient, refreshRouter: () => void) {
  await queryClient.invalidateQueries({ queryKey: authKeys.me() });
  refreshRouter();
}
