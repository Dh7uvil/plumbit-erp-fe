"use client";

import { useQuery } from "@tanstack/react-query";

import { authApi } from "@/modules/users-management/auth/api";

export const authKeys = {
  all: ["auth"] as const,
  me: () => [...authKeys.all, "me"] as const,
};

export function useMe() {
  return useQuery({
    queryKey: authKeys.me(),
    queryFn: authApi.me,
  });
}
