"use client";

import type { QueryKey } from "@tanstack/react-query";

import { useSession } from "@/shared/providers/session-provider";

export function useTenantId(): string {
  return useSession().tenantId ?? "anonymous";
}

export function useTenantQueryKey<T extends QueryKey>(key: T): [...T, string] {
  return [...key, useTenantId()];
}
