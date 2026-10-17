"use client";

import type { FieldPath, FieldValues, UseFormReturn } from "react-hook-form";

import type { CustomerDocumentComposeDefaults } from "@/shared/api/party-compose-schemas";
import {
  useApplyComposeDefaults,
  type ComposeFieldMap,
} from "@/shared/hooks/use-apply-compose-defaults";
import { useCustomerDocumentComposeDefaults } from "@/shared/queries/party-compose-queries";

export const customerComposeFieldMap = {
  currency_id: { field: "currency_id" as const },
  payment_terms_id: { field: "payment_terms_id" as const, optional: true },
  salesperson_id: { field: "salesperson_id" as const, optional: true },
  contact_id: { field: "contact_id" as const, optional: true },
  place_of_supply: { field: "place_of_supply" as const },
  terms_and_conditions: {
    field: "terms_and_conditions" as const,
    transform: (value: string | null) => value ?? "",
  },
  bill_to_snapshot: {
    field: "bill_to_snapshot" as const,
    alwaysRefresh: true,
    transform: (value: string | null) => value ?? "",
  },
  ship_to_snapshot: {
    field: "ship_to_snapshot" as const,
    alwaysRefresh: true,
    transform: (value: string | null) => value ?? "",
  },
  customer_trn: {
    field: "customer_trn" as const,
    alwaysRefresh: true,
    transform: (value: string | null) => value ?? "",
  },
  tax_treatment: { field: "tax_treatment" as const, alwaysRefresh: true },
  warehouse_id: { field: "warehouse_id" as const, optional: true },
  price_list_id: { field: "price_list_id" as const, optional: true },
} satisfies ComposeFieldMap<
  FieldValues & Record<string, unknown>,
  CustomerDocumentComposeDefaults
>;

type CustomerFetcher = (customerId: string) => Promise<CustomerDocumentComposeDefaults>;

export function useCustomerPartyAutofill<TFieldValues extends FieldValues>({
  form,
  queryKey,
  fetcher,
  customerId,
  isEdit,
  disabled,
  dirtyFieldsRef,
  fieldMap,
}: {
  form: UseFormReturn<TFieldValues>;
  queryKey: string;
  fetcher: CustomerFetcher;
  customerId: string | null;
  isEdit: boolean;
  disabled?: boolean;
  dirtyFieldsRef?: React.MutableRefObject<Set<string> | Set<unknown>>;
  fieldMap: ComposeFieldMap<TFieldValues, CustomerDocumentComposeDefaults>;
}) {
  const query = useCustomerDocumentComposeDefaults(queryKey, fetcher, isEdit ? null : customerId);
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
