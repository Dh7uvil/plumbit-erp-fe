"use client";

import { useQuery } from "@tanstack/react-query";

import { contactsApi } from "@/modules/crm/contacts/api";
import type { ContactListParams } from "@/modules/crm/contacts/schemas";

export const contactKeys = {
  all: ["contacts"] as const,
  list: (params: ContactListParams) => [...contactKeys.all, "list", params] as const,
  allItems: () => [...contactKeys.all, "all"] as const,
  detail: (id: string) => [...contactKeys.all, "detail", id] as const,
};

export function useContacts(params: ContactListParams, enabled = true) {
  return useQuery({
    queryKey: contactKeys.list(params),
    queryFn: () => contactsApi.list(params),
    enabled,
  });
}

export function useAllContacts(enabled = true) {
  return useQuery({
    queryKey: contactKeys.allItems(),
    queryFn: contactsApi.listAll,
    enabled,
  });
}

export function useContact(id: string | null) {
  return useQuery({
    queryKey: contactKeys.detail(id ?? ""),
    queryFn: () => contactsApi.get(id!),
    enabled: Boolean(id),
  });
}
