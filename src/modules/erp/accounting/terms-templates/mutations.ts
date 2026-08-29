"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { termsTemplatesApi } from "@/modules/erp/accounting/terms-templates/api";
import { termsTemplateKeys } from "@/modules/erp/accounting/terms-templates/queries";

async function invalidateTermsTemplates(queryClient: ReturnType<typeof useQueryClient>) {
  await queryClient.invalidateQueries({ queryKey: termsTemplateKeys.all });
}

export function useCreateTermsTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: termsTemplatesApi.create,
    onSuccess: async () => {
      await invalidateTermsTemplates(queryClient);
    },
  });
}

export function useUpdateTermsTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      values,
    }: {
      id: string;
      values: Parameters<typeof termsTemplatesApi.update>[1];
    }) => termsTemplatesApi.update(id, values),
    onSuccess: async (_data, { id }) => {
      await invalidateTermsTemplates(queryClient);
      await queryClient.invalidateQueries({ queryKey: termsTemplateKeys.detail(id) });
    },
  });
}

export function useDeleteTermsTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: termsTemplatesApi.delete,
    onSuccess: async () => {
      await invalidateTermsTemplates(queryClient);
    },
  });
}
