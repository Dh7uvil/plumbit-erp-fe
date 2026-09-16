"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { useAllCategories } from "@/modules/inventory-management/categories/queries";
import { useAllProducts } from "@/modules/inventory-management/products/queries";
import { StockReorderDialog } from "@/modules/inventory-management/stock/components/stock-reorder-dialog";
import { stockBalanceColumnDefs } from "@/modules/inventory-management/stock/components/stock-columns";
import { stockPermissions } from "@/modules/inventory-management/stock/permissions";
import { useStock } from "@/modules/inventory-management/stock/queries";
import { type StockBalance } from "@/modules/inventory-management/stock/schemas";
import { stockAdjustmentPermissions } from "@/modules/inventory-management/stock-adjustments/permissions";
import { stockTransferPermissions } from "@/modules/inventory-management/stock-transfers/permissions";
import { useAllWarehouses } from "@/modules/inventory-management/warehouses/queries";
import { useCurrentTenant } from "@/modules/users-management/tenants/queries";
import { getErrorMessage } from "@/shared/api/errors";
import { useCrudPermissions } from "@/shared/auth/use-crud-permissions";
import { DataTableColumnHeads, DataTableCells } from "@/shared/components/data-table/column-cells";
import { DataTable } from "@/shared/components/data-table/data-table";
import { FilterSelect } from "@/shared/components/data-table/filter-select";
import { ListSearch } from "@/shared/components/data-table/list-search";
import { FilterField, MoreFiltersDialog } from "@/shared/components/data-table/more-filters-dialog";
import { DataTablePagination } from "@/shared/components/data-table/pagination";
import { DataTableRowActions, hasRowActions } from "@/shared/components/data-table/row-actions";
import { SortDialog } from "@/shared/components/data-table/sort-dialog";
import { DataTableEmpty, DataTableError } from "@/shared/components/data-table/states";
import { DataTableToolbar } from "@/shared/components/data-table/toolbar";
import { useTableColumns } from "@/shared/components/data-table/use-table-columns";
import { ListPage } from "@/shared/components/layout/list-page";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Button } from "@/shared/components/ui/button";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { TableBody, TableCell, TableHeader, TableRow } from "@/shared/components/ui/table";
import { useTableParams } from "@/shared/hooks/use-table-params";
import { useCan } from "@/shared/providers/session-provider";

const SORT_FIELDS = [
  { value: "qty_on_hand", label: "On hand" },
  { value: "qty_quality_hold", label: "QC hold" },
  { value: "qty_reserved", label: "Reserved" },
  { value: "qty_available", label: "Available" },
  { value: "last_movement_at", label: "Last movement" },
] as const;
const ALL = "all";
const EMPTY_EXTRA = {
  productId: ALL,
  categoryId: ALL,
  negativeOnly: ALL,
  belowReorder: ALL,
};

function extraFromFilters(filters: Record<string, string | undefined>) {
  return {
    productId: filters.product_id ?? ALL,
    categoryId: filters.category_id ?? ALL,
    negativeOnly: filters.negative_only ?? ALL,
    belowReorder: filters.below_reorder ?? ALL,
  };
}

function extraCountOf(extra: typeof EMPTY_EXTRA) {
  return [
    extra.productId !== ALL,
    extra.categoryId !== ALL,
    extra.negativeOnly !== ALL,
    extra.belowReorder !== ALL,
  ].filter(Boolean).length;
}

function parseBoolFilter(value: string | undefined): boolean | undefined {
  if (value === "true") {
    return true;
  }
  return undefined;
}

export function StockScreen() {
  const can = useCan();
  const { canRead, canUpdate } = useCrudPermissions(stockPermissions);
  const canReadCost = can(stockPermissions.costRead);
  const canAdjust = can(stockAdjustmentPermissions.create);
  const canTransfer = can(stockTransferPermissions.create);
  const tenantQuery = useCurrentTenant();
  const currencyCode = tenantQuery.data?.default_currency ?? "";
  const { page, page_size, search, sort_by, sort_order, filters, setParams, setPage } =
    useTableParams();
  const extraFilters = extraFromFilters(filters);
  const extraCount = extraCountOf(extraFilters);
  const [draftExtra, setDraftExtra] = useState(EMPTY_EXTRA);
  const stockQuery = useStock({
    page,
    page_size,
    search,
    sort_by,
    sort_order,
    warehouse_id: filters.warehouse_id,
    product_id: filters.product_id,
    category_id: filters.category_id,
    negative_only: parseBoolFilter(filters.negative_only),
    below_reorder: parseBoolFilter(filters.below_reorder),
  });
  const warehousesQuery = useAllWarehouses();
  const productsQuery = useAllProducts();
  const categoriesQuery = useAllCategories();
  const [reordering, setReordering] = useState<StockBalance | null>(null);
  const showActions = hasRowActions(canRead, canUpdate, canAdjust, canTransfer);
  const rows = stockQuery.data?.data ?? [];
  const meta = stockQuery.data?.meta;
  const warehouses = warehousesQuery.data ?? [];
  const products = productsQuery.data ?? [];
  const categories = categoriesQuery.data ?? [];

  const columnDefs = useMemo(
    () =>
      stockBalanceColumnDefs({
        canReadCost,
        currencyCode,
        actions: showActions
          ? (row) => (
              <DataTableRowActions
                entityName={row.sku}
                viewHref={canRead ? `/stock/${row.product_id}` : undefined}
                extra={
                  <>
                    {canAdjust ? (
                      <Button type="button" variant="ghost" size="sm" className="h-7 px-2" asChild>
                        <Link
                          href={`/stock-adjustments/new?product_id=${row.product_id}&warehouse_id=${row.warehouse_id}`}
                        >
                          Adjust
                        </Link>
                      </Button>
                    ) : null}
                    {canTransfer ? (
                      <Button type="button" variant="ghost" size="sm" className="h-7 px-2" asChild>
                        <Link
                          href={`/stock-transfers/new?product_id=${row.product_id}&warehouse_id=${row.warehouse_id}`}
                        >
                          Transfer
                        </Link>
                      </Button>
                    ) : null}
                    {canUpdate ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2"
                        onClick={() => setReordering(row)}
                      >
                        Reorder
                      </Button>
                    ) : null}
                  </>
                }
              />
            )
          : undefined,
      }),
    [canAdjust, canRead, canReadCost, canTransfer, canUpdate, currencyCode, showActions],
  );

  const { columns, columnsDialog, colSpan } = useTableColumns("inventory.stock", columnDefs);

  return (
    <ListPage>
      <PageHeader
        title="Stock"
        subtitle="On-hand, committed, and available quantity by warehouse"
      />
      <DataTableToolbar>
        <ListSearch
          value={search ?? ""}
          onChange={(value) => setParams({ search: value || null })}
          placeholder="Search SKU, product, or warehouse…"
        />
        <FilterSelect
          label="Warehouse"
          className="w-48"
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
        <MoreFiltersDialog
          extraCount={extraCount}
          draftCount={extraCountOf(draftExtra)}
          description="Filter by product, category, negative on-hand, and reorder."
          onOpen={() => setDraftExtra(extraFilters)}
          onApply={() =>
            setParams({
              filters: {
                product_id: draftExtra.productId === ALL ? null : draftExtra.productId,
                category_id: draftExtra.categoryId === ALL ? null : draftExtra.categoryId,
                negative_only: draftExtra.negativeOnly === ALL ? null : draftExtra.negativeOnly,
                below_reorder: draftExtra.belowReorder === ALL ? null : draftExtra.belowReorder,
              },
            })
          }
          onClearDraft={() => setDraftExtra(EMPTY_EXTRA)}
        >
          <FilterField label="Product" htmlFor="stock-filter-product">
            <FilterSelect
              id="stock-filter-product"
              className="w-full"
              placeholder="Product"
              value={draftExtra.productId}
              onValueChange={(value) =>
                setDraftExtra((current) => ({ ...current, productId: value }))
              }
              options={[
                { value: ALL, label: "All products" },
                ...products.map((product) => ({
                  value: product.id,
                  label: `${product.sku} — ${product.name}`,
                })),
              ]}
            />
          </FilterField>
          <FilterField label="Category" htmlFor="stock-filter-category">
            <FilterSelect
              id="stock-filter-category"
              className="w-full"
              placeholder="Category"
              value={draftExtra.categoryId}
              onValueChange={(value) =>
                setDraftExtra((current) => ({ ...current, categoryId: value }))
              }
              options={[
                { value: ALL, label: "All categories" },
                ...categories.map((category) => ({ value: category.id, label: category.name })),
              ]}
            />
          </FilterField>
          <FilterField label="On hand" htmlFor="stock-filter-negative">
            <FilterSelect
              id="stock-filter-negative"
              className="w-full"
              placeholder="On hand"
              value={draftExtra.negativeOnly}
              onValueChange={(value) =>
                setDraftExtra((current) => ({ ...current, negativeOnly: value }))
              }
              options={[
                { value: ALL, label: "All on-hand" },
                { value: "true", label: "Negative only" },
              ]}
            />
          </FilterField>
          <FilterField label="Reorder" htmlFor="stock-filter-reorder">
            <FilterSelect
              id="stock-filter-reorder"
              className="w-full"
              placeholder="Reorder"
              value={draftExtra.belowReorder}
              onValueChange={(value) =>
                setDraftExtra((current) => ({ ...current, belowReorder: value }))
              }
              options={[
                { value: ALL, label: "All reorder" },
                { value: "true", label: "Below reorder" },
              ]}
            />
          </FilterField>
        </MoreFiltersDialog>
        <SortDialog
          fields={[...SORT_FIELDS]}
          sortBy={sort_by}
          sortOrder={sort_order}
          onApply={setParams}
        />
        {columnsDialog}
        {search || filters.warehouse_id || extraCount > 0 || sort_by ? (
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
                  product_id: null,
                  category_id: null,
                  negative_only: null,
                  below_reorder: null,
                },
              })
            }
          >
            Clear
          </Button>
        ) : null}
      </DataTableToolbar>
      <DataTable footer={meta ? <DataTablePagination meta={meta} onPageChange={setPage} /> : null}>
        <TableHeader>
          <TableRow>
            <DataTableColumnHeads
              columns={columns}
              sortBy={sort_by}
              sortOrder={sort_order}
              onSort={setParams}
            />
          </TableRow>
        </TableHeader>
        <TableBody>
          {stockQuery.isLoading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell colSpan={colSpan}>
                  <Skeleton className="h-6 w-full" />
                </TableCell>
              </TableRow>
            ))
          ) : stockQuery.isError ? (
            <TableRow>
              <TableCell colSpan={colSpan}>
                <DataTableError
                  message={getErrorMessage(stockQuery.error)}
                  onRetry={() => stockQuery.refetch()}
                />
              </TableCell>
            </TableRow>
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={colSpan}>
                <DataTableEmpty
                  title="No stock balances"
                  message="Post an opening-stock adjustment to record quantity."
                />
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow key={row.id}>
                <DataTableCells columns={columns} row={row} />
              </TableRow>
            ))
          )}
        </TableBody>
      </DataTable>
      <StockReorderDialog
        balance={reordering}
        open={Boolean(reordering)}
        onOpenChange={(open) => {
          if (!open) {
            setReordering(null);
          }
        }}
      />
    </ListPage>
  );
}
