"use client";

import type { FieldValues, UseFormReturn } from "react-hook-form";

import type { SupplierDocumentComposeDefaults } from "@/shared/api/party-compose-schemas";
import {
  useApplyComposeDefaults,
  type ComposeFieldMap,
} from "@/shared/hooks/use-apply-compose-defaults";
import { useSupplierDocumentComposeDefaults } from "@/shared/queries/party-compose-queries";

export const supplierComposeFieldMap = {
  currency_id: { field: "currency_id" as const },
  payment_terms_id: { field: "payment_terms_id" as const, optional: true },
  contact_id: { field: "contact_id" as const, optional: true },
  place_of_supply: { field: "place_of_supply" as const },
  warehouse_id: { field: "warehouse_id" as const, optional: true },
  terms_and_conditions: {
    field: "terms_and_conditions" as const,
    transform: (value: string | null) => value ?? "",
  },
  supplier_trn: {
    field: "supplier_trn" as const,
    alwaysRefresh: true,
    transform: (value: string | null) => value ?? "",
  },
  tax_treatment: { field: "tax_treatment" as const, alwaysRefresh: true },
} satisfies ComposeFieldMap<
  FieldValues & Record<string, unknown>,
  SupplierDocumentComposeDefaults
>;

type SupplierFetcher = (supplierId: string) => Promise<SupplierDocumentComposeDefaults>;

export function useSupplierPartyAutofill<TFieldValues extends FieldValues>({
  form,
  queryKey,
  fetcher,
  supplierId,
  isEdit,
  disabled,
  dirtyFieldsRef,
  fieldMap,
}: {
  form: UseFormReturn<TFieldValues>;
  queryKey: string;
  fetcher: SupplierFetcher;
  supplierId: string | null;
  isEdit: boolean;
  disabled?: boolean;
  dirtyFieldsRef?: React.MutableRefObject<Set<string> | Set<unknown>>;
  fieldMap: ComposeFieldMap<TFieldValues, SupplierDocumentComposeDefaults>;
}) {
  const query = useSupplierDocumentComposeDefaults(queryKey, fetcher, isEdit ? null : supplierId);
  useApplyComposeDefaults({
    form,
    defaults: query.data,
    isEdit,
    disabled,
    dirtyFieldsRef,
    fieldMap,
  });
  return query;
}
