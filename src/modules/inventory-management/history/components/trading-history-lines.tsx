"use client";

import { useMemo } from "react";

import { historyPermissions } from "@/modules/inventory-management/history/permissions";
import {
  tradingHistoryColumnDefs,
  type TradingHistoryKind,
} from "@/modules/inventory-management/history/components/trading-history-columns";
import {
  useCustomerSalesHistory,
  useProductPurchaseHistory,
  useProductSalesHistory,
  useSupplierPurchaseHistory,
} from "@/modules/inventory-management/history/queries";
import type { TradingHistoryLine } from "@/modules/inventory-management/history/schemas";
import { useAllWarehouses } from "@/modules/inventory-management/warehouses/queries";
import { DocumentHistoryTable } from "@/shared/components/document/document-history-table";
import { DateRangeFilter } from "@/shared/components/data-table/date-range-filter";
import { FilterSelect } from "@/shared/components/data-table/filter-select";
import { ListSearch } from "@/shared/components/data-table/list-search";
import { SortDialog } from "@/shared/components/data-table/sort-dialog";
import { DataTableToolbar } from "@/shared/components/data-table/toolbar";
import { useTableColumns } from "@/shared/components/data-table/use-table-columns";
import { Button } from "@/shared/components/ui/button";
import { useNestedTableParams } from "@/shared/hooks/use-table-params";
import { useCan } from "@/shared/providers/session-provider";

const ALL = "all";
const HISTORY_SORT_FIELDS = [
  { value: "document_date", label: "Date" },
  { value: "document_number", label: "Document" },
  { value: "quantity", label: "Qty" },
  { value: "rate", label: "Rate" },
  { value: "revenue", label: "Revenue" },
  { value: "party_name", label: "Party" },
  { value: "product_name", label: "Product" },
  { value: "sku", label: "SKU" },
] as const;

export function TradingHistoryLines({
  kind,
  ownerId,
  partyId,
  productId,
  documentHref,
}: {
  kind: TradingHistoryKind;
  ownerId: string;
  partyId?: string;
  productId?: string;
  documentHref?: (row: TradingHistoryLine) => string;
}) {
  const can = useCan();
  const showCost = can(historyPermissions.cost);
  const { page, page_size, search, sort_by, sort_order, filters, setParams, setPage, setPageSize } =
    useNestedTableParams();
  const warehousesQuery = useAllWarehouses();
  const warehouses = warehousesQuery.data ?? [];
  const params = {
    page,
    page_size,
    search,
    sort_by,
    sort_order,
    party_id: partyId,
    product_id: productId,
    warehouse_id: filters.warehouse_id,
    document_date_from: filters.document_date_from,
    document_date_to: filters.document_date_to,
  };
  const productSales = useProductSalesHistory(ownerId, params, kind === "product-sales");
  const productPurchases = useProductPurchaseHistory(ownerId, params, kind === "product-purchases");
  const customerSales = useCustomerSalesHistory(ownerId, params, kind === "customer-sales");
  const supplierPurchases = useSupplierPurchaseHistory(
    ownerId,
    params,
    kind === "supplier-purchases",
  );
  const query =
    kind === "product-sales"
      ? productSales
      : kind === "product-purchases"
        ? productPurchases
        : kind === "customer-sales"
          ? customerSales
          : supplierPurchases;
  const rows = query.data?.data ?? [];
  const showParty = kind === "product-sales" || kind === "product-purchases";
  const showProduct = kind === "customer-sales" || kind === "supplier-purchases";
  const omit = useMemo(
    () => [...(showParty ? [] : ["party"]), ...(showProduct ? [] : ["product"])],
    [showParty, showProduct],
  );
  const columnDefs = useMemo(
    () => tradingHistoryColumnDefs({ kind, showCost, documentHref, omit }),
    [documentHref, kind, omit, showCost],
  );
  const { columns, columnsDialog } = useTableColumns("inventory.trading_history", columnDefs);
  const sortFields = HISTORY_SORT_FIELDS.filter((field) => {
    if (field.value === "party_name") {
      return showParty;
    }
    if (field.value === "product_name" || field.value === "sku") {
      return showProduct;
    }
    return true;
  });
  const hasQuery = Boolean(
    search ||
    filters.warehouse_id ||
    filters.document_date_from ||
    filters.document_date_to ||
    sort_by,
  );

  return (
    <DocumentHistoryTable
      columns={columns}
      rows={rows}
      getRowId={(row) => `${row.document_id}-${row.product_id}-${row.document_date}`}
      isLoading={query.isLoading}
      isError={query.isError}
      error={query.error}
      onRetry={() => query.refetch()}
      emptyTitle="No history"
      emptyMessage="No posted lines for this selection."
      meta={query.data?.meta}
      onPageChange={setPage}
      onPageSizeChange={setPageSize}
      sortBy={sort_by}
      sortOrder={sort_order}
      onSort={setParams}
      toolbar={
        <DataTableToolbar>
          <ListSearch
            value={search ?? ""}
            onChange={(value) => setParams({ search: value || null })}
            placeholder="Search document, party, SKU…"
          />
          <FilterSelect
            label="Warehouse"
            className="w-44"
            placeholder="Warehouse"
            value={filters.warehouse_id ?? ALL}
            onValueChange={(value) =>
              setParams({ filters: { warehouse_id: value === ALL ? null : value } })
            }
            options={[
              { value: ALL, label: "All warehouses" },
              ...warehouses.map((warehouse) => ({
                value: warehouse.id,
                label: `${warehouse.code} — ${warehouse.name}`,
              })),
            ]}
          />
          <DateRangeFilter
            layout="inline"
            from={filters.document_date_from ?? ""}
            to={filters.document_date_to ?? ""}
            onFromChange={(value) => setParams({ filters: { document_date_from: value || null } })}
            onToChange={(value) => setParams({ filters: { document_date_to: value || null } })}
          />
          <SortDialog
            fields={[...sortFields]}
            sortBy={sort_by}
            sortOrder={sort_order}
            onApply={setParams}
          />
          {columnsDialog}
          {hasQuery ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() =>
                setParams({
                  search: null,
                  sort_by: null,
                  sort_order: null,
                  filters: {
                    warehouse_id: null,
                    document_date_from: null,
                    document_date_to: null,
                  },
                })
              }
            >
              Clear
            </Button>
          ) : null}
        </DataTableToolbar>
      }
    />
  );
}
