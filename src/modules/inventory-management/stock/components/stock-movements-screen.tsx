"use client";

import { useState } from "react";

import { useAllCategories } from "@/modules/inventory-management/categories/queries";
import { useAllProducts } from "@/modules/inventory-management/products/queries";
import { useStockMovements } from "@/modules/inventory-management/stock/queries";
import {
  parseStockMovementSourceType,
  parseStockMovementType,
  qtyIsNegative,
  STOCK_MOVEMENT_SOURCE_TYPE_LABELS,
  STOCK_MOVEMENT_SOURCE_TYPES,
  STOCK_MOVEMENT_TYPE_LABELS,
  STOCK_MOVEMENT_TYPES,
  stockMovementSourceHref,
  stockMovementSourceLabel,
} from "@/modules/inventory-management/stock/schemas";
import { useAllWarehouses } from "@/modules/inventory-management/warehouses/queries";
import { getErrorMessage } from "@/shared/api/errors";
import { DataTable } from "@/shared/components/data-table/data-table";
import { FilterSelect } from "@/shared/components/data-table/filter-select";
import { ListSearch } from "@/shared/components/data-table/list-search";
import { FilterField, MoreFiltersDialog } from "@/shared/components/data-table/more-filters-dialog";
import { DataTablePagination } from "@/shared/components/data-table/pagination";
import { RecordLink } from "@/shared/components/data-table/record-link";
import { SortDialog } from "@/shared/components/data-table/sort-dialog";
import { SortableHeads } from "@/shared/components/data-table/sortable-head";
import { DataTableEmpty, DataTableError } from "@/shared/components/data-table/states";
import { DataTableToolbar } from "@/shared/components/data-table/toolbar";
import { ListPage } from "@/shared/components/layout/list-page";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { TableBody, TableCell, TableHeader, TableRow } from "@/shared/components/ui/table";
import { useTableParams } from "@/shared/hooks/use-table-params";
import { cn } from "@/shared/lib/cn";
import { formatDate, formatDecimal } from "@/shared/lib/format";

const COLUMN_HEADERS = ["SKU", "Product", "Warehouse", "Date", "Type", "Qty", "Source"] as const;
const SORT_FIELDS = [
  { value: "sku", label: "SKU" },
  { value: "product_name", label: "Product" },
  { value: "warehouse_code", label: "Warehouse" },
  { value: "document_date", label: "Date" },
  { value: "occurred_at", label: "Occurred" },
  { value: "movement_type", label: "Type" },
] as const;
const SORT_FIELD_BY_HEADER: Partial<Record<string, string>> = {
  SKU: "sku",
  Product: "product_name",
  Warehouse: "warehouse_code",
  Date: "document_date",
  Type: "movement_type",
};
const ALL = "all";
const EMPTY_EXTRA = {
  productId: ALL,
  categoryId: ALL,
  movementType: ALL,
  sourceType: ALL,
  sourceId: "",
  documentDateFrom: "",
  documentDateTo: "",
};

function extraFromFilters(filters: Record<string, string | undefined>) {
  return {
    productId: filters.product_id ?? ALL,
    categoryId: filters.category_id ?? ALL,
    movementType: filters.movement_type ?? ALL,
    sourceType: filters.source_type ?? ALL,
    sourceId: filters.source_id ?? "",
    documentDateFrom: filters.document_date_from ?? "",
    documentDateTo: filters.document_date_to ?? "",
  };
}

function extraCountOf(extra: typeof EMPTY_EXTRA) {
  return [
    extra.productId !== ALL,
    extra.categoryId !== ALL,
    extra.movementType !== ALL,
    extra.sourceType !== ALL,
    extra.sourceId.trim() !== "",
    extra.documentDateFrom !== "",
    extra.documentDateTo !== "",
  ].filter(Boolean).length;
}

function MovementSourceCell({ sourceType, sourceId }: { sourceType: string; sourceId: string }) {
  const href = stockMovementSourceHref(sourceType, sourceId);
  const label = stockMovementSourceLabel(sourceType);
  return href ? <RecordLink href={href}>{label}</RecordLink> : label;
}

export function StockMovementsScreen() {
  const { page, page_size, search, sort_by, sort_order, filters, setParams, setPage } =
    useTableParams();
  const extraFilters = extraFromFilters(filters);
  const extraCount = extraCountOf(extraFilters);
  const [draftExtra, setDraftExtra] = useState(EMPTY_EXTRA);
  const movementsQuery = useStockMovements({
    page,
    page_size,
    search,
    sort_by,
    sort_order,
    warehouse_id: filters.warehouse_id,
    product_id: filters.product_id,
    category_id: filters.category_id,
    movement_type: parseStockMovementType(filters.movement_type),
    source_type: parseStockMovementSourceType(filters.source_type),
    source_id: filters.source_id,
    document_date_from: filters.document_date_from,
    document_date_to: filters.document_date_to,
  });
  const warehousesQuery = useAllWarehouses();
  const productsQuery = useAllProducts();
  const categoriesQuery = useAllCategories();
  const rows = movementsQuery.data?.data ?? [];
  const meta = movementsQuery.data?.meta;
  const warehouses = warehousesQuery.data ?? [];
  const products = productsQuery.data ?? [];
  const categories = categoriesQuery.data ?? [];

  return (
    <ListPage>
      <PageHeader title="Stock movements" subtitle="Ledger of quantity changes" />
      <DataTableToolbar>
        <ListSearch
          value={search ?? ""}
          onChange={(value) => setParams({ search: value || null })}
          placeholder="Search SKU, product, or notes…"
        />
        <FilterSelect
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
          description="Filter by product, category, movement type, source, and document date."
          onOpen={() => setDraftExtra(extraFilters)}
          onApply={() =>
            setParams({
              filters: {
                product_id: draftExtra.productId === ALL ? null : draftExtra.productId,
                category_id: draftExtra.categoryId === ALL ? null : draftExtra.categoryId,
                movement_type: draftExtra.movementType === ALL ? null : draftExtra.movementType,
                source_type: draftExtra.sourceType === ALL ? null : draftExtra.sourceType,
                source_id: draftExtra.sourceId.trim() === "" ? null : draftExtra.sourceId.trim(),
                document_date_from:
                  draftExtra.documentDateFrom === "" ? null : draftExtra.documentDateFrom,
                document_date_to:
                  draftExtra.documentDateTo === "" ? null : draftExtra.documentDateTo,
              },
            })
          }
          onClearDraft={() => setDraftExtra(EMPTY_EXTRA)}
        >
          <FilterField label="Product" htmlFor="movement-filter-product">
            <FilterSelect
              id="movement-filter-product"
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
          <FilterField label="Category" htmlFor="movement-filter-category">
            <FilterSelect
              id="movement-filter-category"
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
          <FilterField label="Movement type" htmlFor="movement-filter-type">
            <FilterSelect
              id="movement-filter-type"
              className="w-full"
              placeholder="Type"
              value={draftExtra.movementType}
              onValueChange={(value) =>
                setDraftExtra((current) => ({ ...current, movementType: value }))
              }
              options={[
                { value: ALL, label: "All types" },
                ...STOCK_MOVEMENT_TYPES.map((type) => ({
                  value: type,
                  label: STOCK_MOVEMENT_TYPE_LABELS[type],
                })),
              ]}
            />
          </FilterField>
          <FilterField label="Source type" htmlFor="movement-filter-source-type">
            <FilterSelect
              id="movement-filter-source-type"
              className="w-full"
              placeholder="Source type"
              value={draftExtra.sourceType}
              onValueChange={(value) =>
                setDraftExtra((current) => ({ ...current, sourceType: value }))
              }
              options={[
                { value: ALL, label: "All sources" },
                ...STOCK_MOVEMENT_SOURCE_TYPES.map((type) => ({
                  value: type,
                  label: STOCK_MOVEMENT_SOURCE_TYPE_LABELS[type],
                })),
              ]}
            />
          </FilterField>
          <FilterField label="Source ID" htmlFor="movement-filter-source-id">
            <Input
              id="movement-filter-source-id"
              value={draftExtra.sourceId}
              onChange={(event) =>
                setDraftExtra((current) => ({ ...current, sourceId: event.target.value }))
              }
              placeholder="Document UUID"
            />
          </FilterField>
          <FilterField label="From date" htmlFor="movement-filter-from">
            <Input
              id="movement-filter-from"
              type="date"
              value={draftExtra.documentDateFrom}
              onChange={(event) =>
                setDraftExtra((current) => ({ ...current, documentDateFrom: event.target.value }))
              }
            />
          </FilterField>
          <FilterField label="To date" htmlFor="movement-filter-to">
            <Input
              id="movement-filter-to"
              type="date"
              value={draftExtra.documentDateTo}
              onChange={(event) =>
                setDraftExtra((current) => ({ ...current, documentDateTo: event.target.value }))
              }
            />
          </FilterField>
        </MoreFiltersDialog>
        <SortDialog
          fields={[...SORT_FIELDS]}
          sortBy={sort_by}
          sortOrder={sort_order}
          onApply={setParams}
        />
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
                  movement_type: null,
                  source_type: null,
                  source_id: null,
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
      <DataTable footer={meta ? <DataTablePagination meta={meta} onPageChange={setPage} /> : null}>
        <TableHeader>
          <TableRow>
            <SortableHeads
              headers={[...COLUMN_HEADERS]}
              fieldByHeader={SORT_FIELD_BY_HEADER}
              sortBy={sort_by}
              sortOrder={sort_order}
              onSort={setParams}
              classNameByHeader={{ Qty: "text-right" }}
            />
          </TableRow>
        </TableHeader>
        <TableBody>
          {movementsQuery.isLoading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell colSpan={COLUMN_HEADERS.length}>
                  <Skeleton className="h-6 w-full" />
                </TableCell>
              </TableRow>
            ))
          ) : movementsQuery.isError ? (
            <TableRow>
              <TableCell colSpan={COLUMN_HEADERS.length}>
                <DataTableError
                  message={getErrorMessage(movementsQuery.error)}
                  onRetry={() => movementsQuery.refetch()}
                />
              </TableCell>
            </TableRow>
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={COLUMN_HEADERS.length}>
                <DataTableEmpty
                  title="No stock movements"
                  message="Posted adjustments and transfers will appear here."
                />
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-mono text-sm">
                  <RecordLink href={`/stock/${row.product_id}`}>{row.sku}</RecordLink>
                </TableCell>
                <TableCell>
                  <RecordLink href={`/stock/${row.product_id}`}>{row.product_name}</RecordLink>
                </TableCell>
                <TableCell>{row.warehouse_code}</TableCell>
                <TableCell>{formatDate(row.document_date)}</TableCell>
                <TableCell>{STOCK_MOVEMENT_TYPE_LABELS[row.movement_type]}</TableCell>
                <TableCell
                  className={cn(
                    "text-right tabular-nums",
                    qtyIsNegative(row.qty) && "text-destructive font-medium",
                  )}
                >
                  {formatDecimal(row.qty)}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  <MovementSourceCell sourceType={row.source_type} sourceId={row.source_id} />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </DataTable>
    </ListPage>
  );
}
