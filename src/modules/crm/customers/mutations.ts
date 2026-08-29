"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { customersApi } from "@/modules/crm/customers/api";
import { customerKeys } from "@/modules/crm/customers/queries";

async function invalidateCustomers(queryClient: ReturnType<typeof useQueryClient>) {
  await queryClient.invalidateQueries({ queryKey: customerKeys.all });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: customersApi.create,
    onSuccess: async () => {
      await invalidateCustomers(queryClient);
    },
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      values,
    }: {
      id: string;
      values: Parameters<typeof customersApi.update>[1];
    }) => customersApi.update(id, values),
    onSuccess: async (_data, { id }) => {
      await invalidateCustomers(queryClient);
      await queryClient.invalidateQueries({ queryKey: customerKeys.detail(id) });
    },
  });
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: customersApi.delete,
    onSuccess: async () => {
      await invalidateCustomers(queryClient);
    },
  });
}

export function useAddCustomerAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      values,
    }: {
      id: string;
      values: Parameters<typeof customersApi.addAddress>[1];
    }) => customersApi.addAddress(id, values),
    onSuccess: async (_data, { id }) => {
      await invalidateCustomers(queryClient);
      await queryClient.invalidateQueries({ queryKey: customerKeys.detail(id) });
    },
  });
}

export function useDeleteCustomerAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, extraId }: { id: string; extraId: string }) =>
      customersApi.deleteAddress(id, extraId),
    onSuccess: async (_data, { id }) => {
      await invalidateCustomers(queryClient);
      await queryClient.invalidateQueries({ queryKey: customerKeys.detail(id) });
    },
  });
}
