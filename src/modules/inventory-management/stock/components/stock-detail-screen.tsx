"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { useProduct } from "@/modules/inventory-management/products/queries";
import { stockBalanceColumnDefs } from "@/modules/inventory-management/stock/components/stock-columns";
import {
  MovementSourceCell,
  stockMovementColumnDefs,
} from "@/modules/inventory-management/stock/components/stock-movement-columns";
import { StockReorderDialog } from "@/modules/inventory-management/stock/components/stock-reorder-dialog";
import { stockPermissions } from "@/modules/inventory-management/stock/permissions";
import {
  useStock,
  useStockLayers,
  useStockMovements,
} from "@/modules/inventory-management/stock/queries";
import {
  parseStockMovementType,
  STOCK_MOVEMENT_TYPE_LABELS,
  STOCK_MOVEMENT_TYPES,
  type StockBalance,
} from "@/modules/inventory-management/stock/schemas";
import { stockAdjustmentPermissions } from "@/modules/inventory-management/stock-adjustments/permissions";
import { stockTransferPermissions } from "@/modules/inventory-management/stock-transfers/permissions";
import { useAllWarehouses } from "@/modules/inventory-management/warehouses/queries";
import { useCurrentTenant } from "@/modules/users-management/tenants/queries";
import { getErrorMessage } from "@/shared/api/errors";
import { DocumentViewTableContainer } from "@/shared/components/document/document-view-table-container";
import { useCrudPermissions } from "@/shared/auth/use-crud-permissions";
import { DataTableColumnHeads, DataTableCells } from "@/shared/components/data-table/column-cells";
import { DataTable } from "@/shared/components/data-table/data-table";
import { DateRangeFilter } from "@/shared/components/data-table/date-range-filter";
import { FilterSelect } from "@/shared/components/data-table/filter-select";
import { ListSearch } from "@/shared/components/data-table/list-search";
import { DataTablePagination } from "@/shared/components/data-table/pagination";
import { DataTableRowActions, hasRowActions } from "@/shared/components/data-table/row-actions";
import { SortDialog } from "@/shared/components/data-table/sort-dialog";
import { DataTableEmpty, DataTableError } from "@/shared/components/data-table/states";
import { DataTableToolbar } from "@/shared/components/data-table/toolbar";
import { useTableColumns } from "@/shared/components/data-table/use-table-columns";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { useNestedTableParams } from "@/shared/hooks/use-table-params";
import { formatDate, formatMoney, formatQuantity } from "@/shared/lib/format";
import { useCan } from "@/shared/providers/session-provider";

const ALL = "all";
const BALANCE_SORT_FIELDS = [
  { value: "qty_on_hand", label: "On hand" },
  { value: "qty_quality_hold", label: "QC hold" },
  { value: "qty_reserved", label: "Reserved" },
  { value: "qty_available", label: "Available" },
  { value: "last_movement_at", label: "Last movement" },
] as const;
const MOVEMENT_SORT_FIELDS = [
  { value: "document_date", label: "Date" },
  { value: "occurred_at", label: "Occurred" },
  { value: "qty", label: "Qty" },
] as const;

function parseTrueFilter(value: string | undefined): boolean | undefined {
  return value === "true" ? true : undefined;
}

function StockBalanceLayers({
  balance,
  currencyCode,
}: {
  balance: StockBalance;
  currencyCode: string;
}) {
  const layersQuery = useStockLayers(balance.id);
  const layers = layersQuery.data ?? [];

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium">
        {balance.warehouse_code} — {balance.warehouse_name}
      </p>
      {layersQuery.isError ? (
        <DataTableError
          message={getErrorMessage(layersQuery.error)}
          onRetry={() => layersQuery.refetch()}
        />
      ) : layersQuery.isLoading ? (
        <Skeleton className="h-8 w-full" />
      ) : layers.length === 0 ? (
        <p className="text-muted-foreground text-sm">No remaining layers.</p>
      ) : (
        <DocumentViewTableContainer viewMode rowCount={layers.length}>
          <table className="w-full caption-bottom text-sm">
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Source</TableHead>
                <TableHead className="text-right">Received</TableHead>
                <TableHead className="text-right">Remaining</TableHead>
                <TableHead className="text-right">Unit cost</TableHead>
                <TableHead className="text-right">Landed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {layers.map((layer) => (
                <TableRow key={layer.id}>
                  <TableCell>{formatDate(layer.document_date)}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    <MovementSourceCell sourceType={layer.source_type} sourceId={layer.source_id} />
                    {layer.is_estimated ? (
                      <Badge variant="secondary" className="ml-2">
                        Estimated
                      </Badge>
                    ) : null}
                    {layer.is_negative ? (
                      <Badge variant="destructive" className="ml-2">
                        Negative
                      </Badge>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatQuantity(layer.qty_received)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatQuantity(layer.qty_remaining)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatMoney(layer.unit_cost, currencyCode)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatMoney(layer.landed_unit_cost, currencyCode)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </table>
        </DocumentViewTableContainer>
      )}
    </div>
  );
}

function WarehouseStockTable({
  productId,
  canReadCost,
  currencyCode,
  canUpdate,
  onReorder,
}: {
  productId: string;
  canReadCost: boolean;
  currencyCode: string;
  canUpdate: boolean;
  onReorder: (row: StockBalance) => void;
}) {
  const { page, page_size, search, sort_by, sort_order, filters, setParams, setPage, setPageSize } =
    useNestedTableParams();
  const balancesQuery = useStock({
    product_id: productId,
    page,
    page_size,
    search,
    sort_by,
    sort_order,
    negative_only: parseTrueFilter(filters.negative_only),
    below_reorder: parseTrueFilter(filters.below_reorder),
  });
  const rows = balancesQuery.data?.data ?? [];
  const meta = balancesQuery.data?.meta;
  const showActions = hasRowActions(canUpdate);
  const columnDefs = useMemo(
    () =>
      stockBalanceColumnDefs({
        canReadCost,
        currencyCode,
        omit: ["sku", "product"],
        actions: showActions
          ? (row) => (
              <DataTableRowActions
                entityName={`${row.warehouse_code} — ${row.warehouse_name}`}
                extra={
                  canUpdate ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2"
                      onClick={() => onReorder(row)}
                    >
                      Reorder
                    </Button>
                  ) : null
                }
              />
            )
          : undefined,
      }),
    [canReadCost, canUpdate, currencyCode, onReorder, showActions],
  );
  const { columns, columnsDialog, colSpan } = useTableColumns("inventory.stock", columnDefs);
  const hasQuery = Boolean(search || filters.negative_only || filters.below_reorder || sort_by);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Warehouse stock</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <DataTableToolbar>
          <ListSearch
            value={search ?? ""}
            onChange={(value) => setParams({ search: value || null })}
            placeholder="Search warehouse…"
          />
          <FilterSelect
            label="Below reorder"
            className="w-40"
            placeholder="Reorder"
            value={filters.below_reorder ?? ALL}
            onValueChange={(value) =>
              setParams({ filters: { below_reorder: value === ALL ? null : value } })
            }
            options={[
              { value: ALL, label: "All" },
              { value: "true", label: "Below reorder" },
            ]}
          />
          <FilterSelect
            label="Negative"
            className="w-36"
            placeholder="Negative"
            value={filters.negative_only ?? ALL}
            onValueChange={(value) =>
              setParams({ filters: { negative_only: value === ALL ? null : value } })
            }
            options={[
              { value: ALL, label: "All" },
              { value: "true", label: "Negative" },
            ]}
          />
          <SortDialog
            fields={[...BALANCE_SORT_FIELDS]}
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
                  filters: { below_reorder: null, negative_only: null },
                })
              }
            >
              Clear
            </Button>
          ) : null}
        </DataTableToolbar>
        <DataTable
          variant="embedded"
          footer={
            meta ? (
              <DataTablePagination
                meta={meta}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
              />
            ) : null
          }
        >
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
            {balancesQuery.isLoading ? (
              Array.from({ length: 3 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell colSpan={colSpan}>
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : balancesQuery.isError ? (
              <TableRow>
                <TableCell colSpan={colSpan}>
                  <DataTableError
                    message={getErrorMessage(balancesQuery.error)}
                    onRetry={() => balancesQuery.refetch()}
                  />
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={colSpan}>
                  <DataTableEmpty
                    title="No warehouse balances"
                    message="No warehouse balances yet."
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
      </CardContent>
    </Card>
  );
}

function ProductMovementsTable({
  productId,
  canReadCost,
  currencyCode,
}: {
  productId: string;
  canReadCost: boolean;
  currencyCode: string;
}) {
  const { page, page_size, search, sort_by, sort_order, filters, setParams, setPage, setPageSize } =
    useNestedTableParams();
  const warehousesQuery = useAllWarehouses();
  const warehouses = warehousesQuery.data ?? [];
  const movementsQuery = useStockMovements({
    product_id: productId,
    page,
    page_size,
    search,
    sort_by,
    sort_order,
    warehouse_id: filters.warehouse_id,
    movement_type: parseStockMovementType(filters.movement_type),
    document_date_from: filters.document_date_from,
    document_date_to: filters.document_date_to,
  });
  const rows = movementsQuery.data?.data ?? [];
  const meta = movementsQuery.data?.meta;
  const columnDefs = useMemo(
    () => stockMovementColumnDefs({ canReadCost, currencyCode, omit: ["sku", "product"] }),
    [canReadCost, currencyCode],
  );
  const { columns, columnsDialog, colSpan } = useTableColumns(
    "inventory.stock_movements",
    columnDefs,
  );
  const hasQuery = Boolean(
    search ||
    filters.warehouse_id ||
    filters.movement_type ||
    filters.document_date_from ||
    filters.document_date_to ||
    sort_by,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Movements</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <DataTableToolbar>
          <ListSearch
            value={search ?? ""}
            onChange={(value) => setParams({ search: value || null })}
            placeholder="Search movements…"
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
          <FilterSelect
            label="Type"
            className="w-44"
            placeholder="Type"
            value={filters.movement_type ?? ALL}
            onValueChange={(value) =>
              setParams({ filters: { movement_type: value === ALL ? null : value } })
            }
            options={[
              { value: ALL, label: "All types" },
              ...STOCK_MOVEMENT_TYPES.map((type) => ({
                value: type,
                label: STOCK_MOVEMENT_TYPE_LABELS[type],
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
            fields={[...MOVEMENT_SORT_FIELDS]}
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
                    movement_type: null,
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
        <DataTable
          variant="embedded"
          footer={
            meta ? (
              <DataTablePagination
                meta={meta}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
              />
            ) : null
          }
        >
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
            {movementsQuery.isLoading ? (
              Array.from({ length: 3 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell colSpan={colSpan}>
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : movementsQuery.isError ? (
              <TableRow>
                <TableCell colSpan={colSpan}>
                  <DataTableError
                    message={getErrorMessage(movementsQuery.error)}
                    onRetry={() => movementsQuery.refetch()}
                  />
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={colSpan}>
                  <DataTableEmpty
                    title="No movements"
                    message="No stock has moved for this product yet."
                  />
                </TableCell>
              </TableRow>
            ) : (
              rows.map((movement) => (
                <TableRow key={movement.id}>
                  <DataTableCells columns={columns} row={movement} />
                </TableRow>
              ))
            )}
          </TableBody>
        </DataTable>
      </CardContent>
    </Card>
  );
}

export function StockDetailScreen({ productId }: { productId: string }) {
  const can = useCan();
  const { canUpdate } = useCrudPermissions(stockPermissions);
  const canReadCost = can(stockPermissions.costRead);
  const canAdjust = can(stockAdjustmentPermissions.create);
  const canTransfer = can(stockTransferPermissions.create);
  const tenantQuery = useCurrentTenant();
  const currencyCode = tenantQuery.data?.default_currency ?? "";
  const productQuery = useProduct(productId);
  const layersQuery = useStock({ product_id: productId, page_size: 100 });
  const [reordering, setReordering] = useState<StockBalance | null>(null);
  const product = productQuery.data;
  const layerBalances = layersQuery.data?.data ?? [];

  if (productQuery.isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (productQuery.isError || !product) {
    return (
      <div className="flex flex-col gap-3">
        <DataTableError
          message={productQuery.error ? getErrorMessage(productQuery.error) : "Product not found"}
          onRetry={() => productQuery.refetch()}
        />
        <Button type="button" variant="outline" asChild>
          <Link href="/stock">Back to stock</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title={product.name}
        code={product.sku}
        codeTooltip="SKU"
        subtitle="Warehouse balances and movement ledger"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {canAdjust ? (
              <Button type="button" size="sm" asChild>
                <Link href={`/stock-adjustments/new?product_id=${product.id}`}>Adjust</Link>
              </Button>
            ) : null}
            {canTransfer ? (
              <Button type="button" size="sm" variant="outline" asChild>
                <Link href={`/stock-transfers/new?product_id=${product.id}`}>Transfer</Link>
              </Button>
            ) : null}
            <Button type="button" variant="outline" size="sm" asChild>
              <Link href="/stock">Back</Link>
            </Button>
          </div>
        }
      />
      <WarehouseStockTable
        productId={product.id}
        canReadCost={canReadCost}
        currencyCode={currencyCode}
        canUpdate={canUpdate}
        onReorder={setReordering}
      />
      {canReadCost && layerBalances.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cost layers</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {layerBalances.map((balance) => (
              <StockBalanceLayers key={balance.id} balance={balance} currencyCode={currencyCode} />
            ))}
          </CardContent>
        </Card>
      ) : null}
      <ProductMovementsTable
        productId={product.id}
        canReadCost={canReadCost}
        currencyCode={currencyCode}
      />
      <StockReorderDialog
        balance={reordering}
        open={Boolean(reordering)}
        onOpenChange={(open) => {
          if (!open) {
            setReordering(null);
          }
        }}
      />
    </div>
  );
}
