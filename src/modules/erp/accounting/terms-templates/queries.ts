"use client";

import { useQuery } from "@tanstack/react-query";

import { termsTemplatesApi } from "@/modules/erp/accounting/terms-templates/api";
import type { TermsTemplateListParams } from "@/modules/erp/accounting/terms-templates/schemas";

export const termsTemplateKeys = {
  all: ["terms-templates"] as const,
  list: (params: TermsTemplateListParams) => [...termsTemplateKeys.all, "list", params] as const,
  allItems: () => [...termsTemplateKeys.all, "all"] as const,
  detail: (id: string) => [...termsTemplateKeys.all, "detail", id] as const,
};

export function useTermsTemplates(params: TermsTemplateListParams) {
  return useQuery({
    queryKey: termsTemplateKeys.list(params),
    queryFn: () => termsTemplatesApi.list(params),
  });
}

export function useAllTermsTemplates(enabled = true) {
  return useQuery({
    queryKey: termsTemplateKeys.allItems(),
    queryFn: termsTemplatesApi.listAll,
    enabled,
  });
}

export function useTermsTemplate(id: string | null) {
  return useQuery({
    queryKey: termsTemplateKeys.detail(id ?? ""),
    queryFn: () => termsTemplatesApi.get(id!),
    enabled: Boolean(id),
  });
}
