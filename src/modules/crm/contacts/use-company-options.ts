"use client";

import { useMemo } from "react";

import { customerPermissions } from "@/modules/crm/customers/permissions";
import { useAllCustomers } from "@/modules/crm/customers/queries";
import { supplierPermissions } from "@/modules/erp/suppliers/permissions";
import { useAllSuppliers } from "@/modules/erp/suppliers/queries";
import { useCan } from "@/shared/providers/session-provider";

export type CompanyOption = {
  id: string;
  name: string;
};

export function useCompanyOptions(enabled = true) {
  const can = useCan();
  const customersQuery = useAllCustomers(enabled && can(customerPermissions.read));
  const suppliersQuery = useAllSuppliers(enabled && can(supplierPermissions.read));

  const companies = useMemo(() => {
    const map = new Map<string, CompanyOption>();
    for (const party of [...(customersQuery.data ?? []), ...(suppliersQuery.data ?? [])]) {
      if (!map.has(party.id)) {
        map.set(party.id, { id: party.id, name: party.name });
      }
    }
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [customersQuery.data, suppliersQuery.data]);

  return {
    companies,
    isLoading: customersQuery.isLoading || suppliersQuery.isLoading,
  };
}
