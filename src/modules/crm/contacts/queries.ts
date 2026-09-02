"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { contactsApi } from "@/modules/crm/contacts/api";
import type { ContactListParams } from "@/modules/crm/contacts/schemas";
import { useTenantQueryKey } from "@/shared/hooks/use-tenant-query-key";

export const contactKeys = {
  all: ["contacts"] as const,
  list: (params: ContactListParams) => [...contactKeys.all, "list", params] as const,
  allItems: () => [...contactKeys.all, "all"] as const,
  detail: (id: string) => [...contactKeys.all, "detail", id] as const,
};

export function useContacts(params: ContactListParams, enabled = true) {
  return useQuery({
    queryKey: useTenantQueryKey(contactKeys.list(params)),
    queryFn: () => contactsApi.list(params),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useAllContacts(enabled = true) {
  return useQuery({
    queryKey: useTenantQueryKey(contactKeys.allItems()),
    queryFn: () => contactsApi.listAll(),
    enabled,
  });
}

export function usePartyContacts(customerId: string | null, enabled = true) {
  return useQuery({
    queryKey: useTenantQueryKey([...contactKeys.all, "party", customerId] as const),
    queryFn: () => contactsApi.listAll({ customer_id: customerId! }),
    enabled: Boolean(customerId) && enabled,
  });
}

export function useContact(id: string | null) {
  return useQuery({
    queryKey: useTenantQueryKey(contactKeys.detail(id ?? "")),
    queryFn: () => contactsApi.get(id!),
    enabled: Boolean(id),
  });
}
