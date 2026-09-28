"use client";

import { useQuery } from "@tanstack/react-query";

import { contactsApi } from "@/modules/crm/contacts/api";
import { customersApi } from "@/modules/crm/customers/api";
import { leadDisplayName } from "@/modules/crm/leads/schemas";
import { leadsApi } from "@/modules/crm/leads/api";
import { opportunitiesApi } from "@/modules/crm/opportunities/api";
import { purchaseOrdersApi } from "@/modules/erp/purchase-orders/api";
import { quotationsApi } from "@/modules/erp/quotations/api";
import { salesOrdersApi } from "@/modules/erp/sales-orders/api";
import { suppliersApi } from "@/modules/erp/suppliers/api";
import { goodsReceiptsApi } from "@/modules/inventory-management/goods-receipts/api";
import { productsApi } from "@/modules/inventory-management/products/api";
import type { TaskRelatedEntityType } from "@/modules/task-management/tasks/schemas";
import { fetchAllPages } from "@/shared/api/paginate";
import { useTenantQueryKey } from "@/shared/hooks/use-tenant-query-key";
import type { SearchableSelectOption } from "@/shared/components/form/searchable-select";

export const taskRelatedEntityKeys = {
  all: ["task-related-entities"] as const,
  options: (type: TaskRelatedEntityType) => [...taskRelatedEntityKeys.all, type] as const,
};

async function loadRelatedEntityOptions(
  type: TaskRelatedEntityType,
): Promise<SearchableSelectOption[]> {
  switch (type) {
    case "customer": {
      const rows = await customersApi.listAll();
      return rows.map((row) => ({
        value: row.id,
        label: row.code ? `${row.name} (${row.code})` : row.name,
      }));
    }
    case "contact": {
      const rows = await contactsApi.listAll();
      return rows.map((row) => ({ value: row.id, label: row.name }));
    }
    case "lead": {
      const rows = await fetchAllPages((page, pageSize) =>
        leadsApi.list({ page, page_size: pageSize }),
      );
      return rows.map((row) => ({ value: row.id, label: leadDisplayName(row) }));
    }
    case "opportunity": {
      const rows = await fetchAllPages((page, pageSize) =>
        opportunitiesApi.list({ page, page_size: pageSize }),
      );
      return rows.map((row) => ({
        value: row.id,
        label: `${row.name} (${row.opportunity_number})`,
      }));
    }
    case "product": {
      const rows = await productsApi.listAll();
      return rows.map((row) => ({
        value: row.id,
        label: `${row.name} (${row.sku})`,
      }));
    }
    case "quotation": {
      const rows = await fetchAllPages((page, pageSize) =>
        quotationsApi.list({ page, page_size: pageSize }),
      );
      return rows.map((row) => ({
        value: row.id,
        label: row.display_number ?? row.quote_number,
      }));
    }
    case "sales_order": {
      const rows = await fetchAllPages((page, pageSize) =>
        salesOrdersApi.list({ page, page_size: pageSize }),
      );
      return rows.map((row) => ({
        value: row.id,
        label: row.document_number,
      }));
    }
    case "purchase_order": {
      const rows = await fetchAllPages((page, pageSize) =>
        purchaseOrdersApi.list({ page, page_size: pageSize }),
      );
      return rows.map((row) => ({
        value: row.id,
        label: row.document_number,
      }));
    }
    case "goods_receipt": {
      const rows = await fetchAllPages((page, pageSize) =>
        goodsReceiptsApi.list({ page, page_size: pageSize }),
      );
      return rows.map((row) => ({
        value: row.id,
        label: row.document_number,
      }));
    }
    case "supplier": {
      const rows = await suppliersApi.listAll();
      return rows.map((row) => ({
        value: row.id,
        label: row.code ? `${row.name} (${row.code})` : row.name,
      }));
    }
  }
}

export function useTaskRelatedEntityOptions(type: TaskRelatedEntityType | null, enabled = true) {
  const queryKey = useTenantQueryKey(
    type ? taskRelatedEntityKeys.options(type) : [...taskRelatedEntityKeys.all, "none"],
  );
  return useQuery({
    queryKey,
    queryFn: () => loadRelatedEntityOptions(type!),
    enabled: enabled && Boolean(type),
  });
}
