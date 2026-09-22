"use client";

import { useMemo, useState } from "react";

import { TradingHistoryLines } from "@/modules/inventory-management/history/components/trading-history-lines";
import {
  tradingPartyAggregateColumnDefs,
  tradingProductAggregateColumnDefs,
} from "@/modules/inventory-management/history/components/trading-history-columns";
import { historyPermissions } from "@/modules/inventory-management/history/permissions";
import {
  useCustomerProducts,
  useProductCustomers,
} from "@/modules/inventory-management/history/queries";
import { DocumentHistoryTable } from "@/shared/components/document/document-history-table";
import { ListSearch } from "@/shared/components/data-table/list-search";
import { SortDialog } from "@/shared/components/data-table/sort-dialog";
import { DataTableToolbar } from "@/shared/components/data-table/toolbar";
import { useTableColumns } from "@/shared/components/data-table/use-table-columns";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { useNestedTableParams } from "@/shared/hooks/use-table-params";
import { useCan } from "@/shared/providers/session-provider";

const PARTY_SORT_FIELDS = [
  { value: "party_name", label: "Customer" },
  { value: "total_quantity", label: "Qty" },
  { value: "revenue", label: "Revenue" },
  { value: "last_date", label: "Last" },
  { value: "dispatch_count", label: "Dispatches" },
] as const;

const PRODUCT_SORT_FIELDS = [
  { value: "sku", label: "SKU" },
  { value: "product_name", label: "Product" },
  { value: "total_quantity", label: "Qty" },
  { value: "revenue", label: "Revenue" },
  { value: "last_date", label: "Last" },
  { value: "dispatch_count", label: "Dispatches" },
] as const;

export function ProductCustomersCard({ productId }: { productId: string }) {
  const can = useCan();
  const enabled = can(historyPermissions.product);
  const { page, page_size, search, sort_by, sort_order, setParams, setPage, setPageSize } =
    useNestedTableParams();
  const query = useProductCustomers(
    productId,
    { page, page_size, search, sort_by, sort_order },
    enabled,
  );
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const rows = query.data?.data ?? [];
  const columnDefs = useMemo(() => tradingPartyAggregateColumnDefs(), []);
  const { columns, columnsDialog } = useTableColumns(
    "inventory.trading_party_aggregates",
    columnDefs,
  );
  const hasQuery = Boolean(search || sort_by);

  if (!enabled) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Customers</CardTitle>
      </CardHeader>
      <CardContent>
        <DocumentHistoryTable
          columns={columns}
          rows={rows}
          getRowId={(row) => row.party_id}
          isLoading={query.isLoading}
          isError={query.isError}
          error={query.error}
          onRetry={() => query.refetch()}
          emptyTitle="No customers"
          emptyMessage="No posted sales for this product yet."
          meta={query.data?.meta}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          sortBy={sort_by}
          sortOrder={sort_order}
          onSort={setParams}
          expandedId={expandedId}
          onToggleExpand={(id) => setExpandedId((current) => (current === id ? null : id))}
          renderExpanded={(row) => (
            <TradingHistoryLines kind="product-sales" ownerId={productId} partyId={row.party_id} />
          )}
          toolbar={
            <DataTableToolbar>
              <ListSearch
                value={search ?? ""}
                onChange={(value) => setParams({ search: value || null })}
                placeholder="Search customer…"
              />
              <SortDialog
                fields={[...PARTY_SORT_FIELDS]}
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
                  onClick={() => setParams({ search: null, sort_by: null, sort_order: null })}
                >
                  Clear
                </Button>
              ) : null}
            </DataTableToolbar>
          }
        />
      </CardContent>
    </Card>
  );
}

export function ProductSalesHistoryCard({ productId }: { productId: string }) {
  const can = useCan();
  const enabled = can(historyPermissions.product);
  if (!enabled) {
    return null;
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Sales history</CardTitle>
      </CardHeader>
      <CardContent>
        <TradingHistoryLines
          kind="product-sales"
          ownerId={productId}
          documentHref={(row) => `/delivery-notes/${row.document_id}`}
        />
      </CardContent>
    </Card>
  );
}

export function ProductPurchaseHistoryCard({ productId }: { productId: string }) {
  const can = useCan();
  const enabled = can(historyPermissions.product);
  if (!enabled) {
    return null;
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Purchase history</CardTitle>
      </CardHeader>
      <CardContent>
        <TradingHistoryLines
          kind="product-purchases"
          ownerId={productId}
          documentHref={(row) => `/goods-receipts/${row.document_id}`}
        />
      </CardContent>
    </Card>
  );
}

export function CustomerSoldItemsCard({ customerId }: { customerId: string }) {
  const can = useCan();
  const enabled = can(historyPermissions.customer);
  const { page, page_size, search, sort_by, sort_order, setParams, setPage, setPageSize } =
    useNestedTableParams();
  const query = useCustomerProducts(
    customerId,
    { page, page_size, search, sort_by, sort_order },
    enabled,
  );
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const rows = query.data?.data ?? [];
  const columnDefs = useMemo(() => tradingProductAggregateColumnDefs(), []);
  const { columns, columnsDialog } = useTableColumns(
    "inventory.trading_product_aggregates",
    columnDefs,
  );
  const hasQuery = Boolean(search || sort_by);

  if (!enabled) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Sold items</CardTitle>
      </CardHeader>
      <CardContent>
        <DocumentHistoryTable
          columns={columns}
          rows={rows}
          getRowId={(row) => row.product_id}
          isLoading={query.isLoading}
          isError={query.isError}
          error={query.error}
          onRetry={() => query.refetch()}
          emptyTitle="No sold items"
          emptyMessage="No posted deliveries for this customer yet."
          meta={query.data?.meta}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          sortBy={sort_by}
          sortOrder={sort_order}
          onSort={setParams}
          expandedId={expandedId}
          onToggleExpand={(id) => setExpandedId((current) => (current === id ? null : id))}
          renderExpanded={(row) => (
            <TradingHistoryLines
              kind="customer-sales"
              ownerId={customerId}
              productId={row.product_id}
            />
          )}
          toolbar={
            <DataTableToolbar>
              <ListSearch
                value={search ?? ""}
                onChange={(value) => setParams({ search: value || null })}
                placeholder="Search SKU or product…"
              />
              <SortDialog
                fields={[...PRODUCT_SORT_FIELDS]}
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
                  onClick={() => setParams({ search: null, sort_by: null, sort_order: null })}
                >
                  Clear
                </Button>
              ) : null}
            </DataTableToolbar>
          }
        />
      </CardContent>
    </Card>
  );
}

export function CustomerSalesHistoryCard({ customerId }: { customerId: string }) {
  const can = useCan();
  const enabled = can(historyPermissions.customer);
  if (!enabled) {
    return null;
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Sales history</CardTitle>
      </CardHeader>
      <CardContent>
        <TradingHistoryLines kind="customer-sales" ownerId={customerId} />
      </CardContent>
    </Card>
  );
}

export function SupplierPurchaseHistoryCard({ supplierId }: { supplierId: string }) {
  const can = useCan();
  const enabled = can(historyPermissions.supplier);
  if (!enabled) {
    return null;
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Purchase history</CardTitle>
      </CardHeader>
      <CardContent>
        <TradingHistoryLines
          kind="supplier-purchases"
          ownerId={supplierId}
          documentHref={(row) => `/goods-receipts/${row.document_id}`}
        />
      </CardContent>
    </Card>
  );
}
