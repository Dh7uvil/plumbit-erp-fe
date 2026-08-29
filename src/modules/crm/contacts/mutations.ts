"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { contactsApi } from "@/modules/crm/contacts/api";
import { contactKeys } from "@/modules/crm/contacts/queries";

async function invalidateContacts(queryClient: ReturnType<typeof useQueryClient>) {
  await queryClient.invalidateQueries({ queryKey: contactKeys.all });
}

export function useCreateContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: contactsApi.create,
    onSuccess: async () => {
      await invalidateContacts(queryClient);
    },
  });
}

export function useUpdateContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      values,
    }: {
      id: string;
      values: Parameters<typeof contactsApi.update>[1];
    }) => contactsApi.update(id, values),
    onSuccess: async (_data, { id }) => {
      await invalidateContacts(queryClient);
      await queryClient.invalidateQueries({ queryKey: contactKeys.detail(id) });
    },
  });
}

export function useDeleteContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: contactsApi.delete,
    onSuccess: async () => {
      await invalidateContacts(queryClient);
    },
  });
}
