"use client";

import { Copy, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { useAllProducts } from "@/modules/inventory-management/products/queries";
import { StockAdjustmentStatusBadge } from "@/modules/inventory-management/stock-adjustments/components/stock-adjustment-status-badge";
import {
  useCloneStockAdjustment,
  useDeleteStockAdjustment,
} from "@/modules/inventory-management/stock-adjustments/mutations";
import { stockAdjustmentPermissions } from "@/modules/inventory-management/stock-adjustments/permissions";
import { useStockAdjustments } from "@/modules/inventory-management/stock-adjustments/queries";
import {
  STOCK_ADJUSTMENT_REASON_LABELS,
  STOCK_ADJUSTMENT_REASONS,
  STOCK_DOCUMENT_STATUS_LABELS,
  STOCK_DOCUMENT_STATUSES,
  stockAdjustmentDisplayNumber,
  type StockAdjustment,
  type StockAdjustmentReason,
  type StockDocumentStatus,
} from "@/modules/inventory-management/stock-adjustments/schemas";
import {
  STOCK_ADJUSTMENT_ACTION_LABELS,
  stockAdjustmentActionEffect,
} from "@/modules/inventory-management/stock-adjustments/workflow";
import { useAllWarehouses } from "@/modules/inventory-management/warehouses/queries";
import { useAllBranches } from "@/modules/users-management/branches/queries";
import { getErrorMessage } from "@/shared/api/errors";
import { emptyListMessage, useCrudPermissions } from "@/shared/auth/use-crud-permissions";
import { DataTable } from "@/shared/components/data-table/data-table";
import { FilterSelect } from "@/shared/components/data-table/filter-select";
import { ListSearch } from "@/shared/components/data-table/list-search";
import { FilterField, MoreFiltersDialog } from "@/shared/components/data-table/more-filters-dialog";
import { DataTablePagination } from "@/shared/components/data-table/pagination";
import { RecordLink } from "@/shared/components/data-table/record-link";
import {
  DataTableRowActions,
  hasRowActions,
  tableHeaders,
} from "@/shared/components/data-table/row-actions";
import { SortDialog } from "@/shared/components/data-table/sort-dialog";
import { SortableHeads } from "@/shared/components/data-table/sortable-head";
import { DataTableEmpty, DataTableError } from "@/shared/components/data-table/states";
import { ConfirmActionDialog } from "@/shared/components/feedback/confirm-action-dialog";
import { DataTableToolbar } from "@/shared/components/data-table/toolbar";
import { ListPage } from "@/shared/components/layout/list-page";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { TableBody, TableCell, TableHeader, TableRow } from "@/shared/components/ui/table";
import { useTableParams } from "@/shared/hooks/use-table-params";
import { formatDate } from "@/shared/lib/format";

const COLUMN_HEADERS = ["Number", "Date", "Warehouse", "Reason", "Status"] as const;
const ALL = "all";
const EMPTY_EXTRA = {
  reason: ALL,
  branchId: ALL,
  productId: ALL,
  documentDateFrom: "",
  documentDateTo: "",
};

function extraFromFilters(filters: Record<string, string | undefined>) {
  return {
    reason: filters.reason ?? ALL,
    branchId: filters.branch_id ?? ALL,
    productId: filters.product_id ?? ALL,
    documentDateFrom: filters.document_date_from ?? "",
    documentDateTo: filters.document_date_to ?? "",
  };
}

function extraCountOf(extra: typeof EMPTY_EXTRA) {
  return [
    extra.reason !== ALL,
    extra.branchId !== ALL,
    extra.productId !== ALL,
    extra.documentDateFrom !== "",
    extra.documentDateTo !== "",
  ].filter(Boolean).length;
}

const SORT_FIELDS = [
  { value: "document_number", label: "Number" },
  { value: "document_date", label: "Date" },
  { value: "status", label: "Status" },
] as const;
const SORT_FIELD_BY_HEADER: Partial<Record<string, string>> = {
  Number: "document_number",
  Date: "document_date",
  Status: "status",
};

function parseStatus(value: string | undefined): StockDocumentStatus | undefined {
  return STOCK_DOCUMENT_STATUSES.includes(value as StockDocumentStatus)
    ? (value as StockDocumentStatus)
    : undefined;
}

function parseReason(value: string | undefined): StockAdjustmentReason | undefined {
  return STOCK_ADJUSTMENT_REASONS.includes(value as StockAdjustmentReason)
    ? (value as StockAdjustmentReason)
    : undefined;
}

export function StockAdjustmentsScreen() {
  const { canCreate, canRead, canUpdate, canDelete } = useCrudPermissions(
    stockAdjustmentPermissions,
  );
  const router = useRouter();
  const { page, page_size, search, sort_by, sort_order, filters, setParams, setPage } =
    useTableParams();
  const extraFilters = extraFromFilters(filters);
  const extraCount = extraCountOf(extraFilters);
  const [draftExtra, setDraftExtra] = useState(EMPTY_EXTRA);
  const adjustmentsQuery = useStockAdjustments({
    page,
    page_size,
    search,
    sort_by,
    sort_order,
    status: parseStatus(filters.status),
    warehouse_id: filters.warehouse_id,
    reason: parseReason(filters.reason),
    branch_id: filters.branch_id,
    product_id: filters.product_id,
    document_date_from: filters.document_date_from,
    document_date_to: filters.document_date_to,
  });
  const warehousesQuery = useAllWarehouses();
  const productsQuery = useAllProducts();
  const branchesQuery = useAllBranches();
  const cloneAdjustment = useCloneStockAdjustment();
  const deleteAdjustment = useDeleteStockAdjustment();
  const [deleting, setDeleting] = useState<StockAdjustment | null>(null);
  const rows = adjustmentsQuery.data?.data ?? [];
  const meta = adjustmentsQuery.data?.meta;
  const warehouses = warehousesQuery.data ?? [];
  const products = productsQuery.data ?? [];
  const branches = branchesQuery.data ?? [];
  const warehouseLabelById = new Map(
    warehouses.map((warehouse) => [warehouse.id, `${warehouse.code} — ${warehouse.name}`]),
  );
  const showActions = hasRowActions(canRead, canUpdate, canCreate, canDelete);
  const headers = tableHeaders(COLUMN_HEADERS, showActions);

  async function onClone(id: string) {
    try {
      const cloned = await cloneAdjustment.mutateAsync(id);
      toast.success("Stock adjustment cloned");
      router.push(`/stock-adjustments/${cloned.id}`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  async function onDelete() {
    if (!deleting) {
      return;
    }
    try {
      await deleteAdjustment.mutateAsync({ id: deleting.id, version: deleting.version });
      toast.success("Stock adjustment deleted");
      setDeleting(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <ListPage>
      <PageHeader
        title="Stock adjustments"
        subtitle="Opening stock, counts, and quantity corrections"
        actions={
          canCreate ? (
            <Button type="button" size="sm" asChild>
              <Link href="/stock-adjustments/new">
                <Plus className="size-3.5" />
                New adjustment
              </Link>
            </Button>
          ) : undefined
        }
      />
      <DataTableToolbar>
        <ListSearch
          value={search ?? ""}
          onChange={(value) => setParams({ search: value || null })}
          placeholder="Search adjustments…"
        />
        <FilterSelect
          className="w-40"
          placeholder="Status"
          value={filters.status ?? ALL}
          onValueChange={(value) =>
            setParams({ filters: { status: value === ALL ? null : value } })
          }
          options={[
            { value: ALL, label: "All statuses" },
            ...STOCK_DOCUMENT_STATUSES.map((status) => ({
              value: status,
              label: STOCK_DOCUMENT_STATUS_LABELS[status],
            })),
          ]}
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
          description="Filter by reason, branch, product, and document date."
          onOpen={() => setDraftExtra(extraFilters)}
          onApply={() =>
            setParams({
              filters: {
                reason: draftExtra.reason === ALL ? null : draftExtra.reason,
                branch_id: draftExtra.branchId === ALL ? null : draftExtra.branchId,
                product_id: draftExtra.productId === ALL ? null : draftExtra.productId,
                document_date_from:
                  draftExtra.documentDateFrom === "" ? null : draftExtra.documentDateFrom,
                document_date_to:
                  draftExtra.documentDateTo === "" ? null : draftExtra.documentDateTo,
              },
            })
          }
          onClearDraft={() => setDraftExtra(EMPTY_EXTRA)}
        >
          <FilterField label="Reason" htmlFor="adjustment-filter-reason">
            <FilterSelect
              id="adjustment-filter-reason"
              className="w-full"
              placeholder="Reason"
              value={draftExtra.reason}
              onValueChange={(value) => setDraftExtra((current) => ({ ...current, reason: value }))}
              options={[
                { value: ALL, label: "All reasons" },
                ...STOCK_ADJUSTMENT_REASONS.map((reason) => ({
                  value: reason,
                  label: STOCK_ADJUSTMENT_REASON_LABELS[reason],
                })),
              ]}
            />
          </FilterField>
          <FilterField label="Branch" htmlFor="adjustment-filter-branch">
            <FilterSelect
              id="adjustment-filter-branch"
              className="w-full"
              placeholder="Branch"
              value={draftExtra.branchId}
              onValueChange={(value) =>
                setDraftExtra((current) => ({ ...current, branchId: value }))
              }
              options={[
                { value: ALL, label: "All branches" },
                ...branches.map((branch) => ({ value: branch.id, label: branch.name })),
              ]}
            />
          </FilterField>
          <FilterField label="Product" htmlFor="adjustment-filter-product">
            <FilterSelect
              id="adjustment-filter-product"
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
          <FilterField label="From date" htmlFor="adjustment-filter-from">
            <Input
              id="adjustment-filter-from"
              type="date"
              value={draftExtra.documentDateFrom}
              onChange={(event) =>
                setDraftExtra((current) => ({ ...current, documentDateFrom: event.target.value }))
              }
            />
          </FilterField>
          <FilterField label="To date" htmlFor="adjustment-filter-to">
            <Input
              id="adjustment-filter-to"
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
        {search || filters.status || filters.warehouse_id || extraCount > 0 || sort_by ? (
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
                  status: null,
                  warehouse_id: null,
                  reason: null,
                  branch_id: null,
                  product_id: null,
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
              headers={headers}
              fieldByHeader={SORT_FIELD_BY_HEADER}
              sortBy={sort_by}
              sortOrder={sort_order}
              onSort={setParams}
            />
          </TableRow>
        </TableHeader>
        <TableBody>
          {adjustmentsQuery.isLoading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell colSpan={headers.length}>
                  <Skeleton className="h-6 w-full" />
                </TableCell>
              </TableRow>
            ))
          ) : adjustmentsQuery.isError ? (
            <TableRow>
              <TableCell colSpan={headers.length}>
                <DataTableError
                  message={getErrorMessage(adjustmentsQuery.error)}
                  onRetry={() => adjustmentsQuery.refetch()}
                />
              </TableCell>
            </TableRow>
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={headers.length}>
                <DataTableEmpty
                  title="No stock adjustments"
                  message={emptyListMessage(canCreate, "Create an adjustment to get started.")}
                />
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => {
              const number = stockAdjustmentDisplayNumber(row);
              return (
                <TableRow key={row.id}>
                  <TableCell className="font-mono text-sm">
                    <RecordLink href={`/stock-adjustments/${row.id}`}>{number ?? "—"}</RecordLink>
                  </TableCell>
                  <TableCell>{formatDate(row.document_date)}</TableCell>
                  <TableCell>{warehouseLabelById.get(row.warehouse_id) ?? "—"}</TableCell>
                  <TableCell>{STOCK_ADJUSTMENT_REASON_LABELS[row.reason]}</TableCell>
                  <TableCell>
                    <StockAdjustmentStatusBadge status={row.status} />
                  </TableCell>
                  {showActions ? (
                    <TableCell>
                      <DataTableRowActions
                        entityName={number ?? "adjustment"}
                        viewHref={canRead ? `/stock-adjustments/${row.id}` : undefined}
                        editHref={
                          canUpdate && row.status === "DRAFT"
                            ? `/stock-adjustments/${row.id}/edit`
                            : undefined
                        }
                        extra={
                          row.available_actions.includes("clone") && canCreate ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="size-7"
                              aria-label="Clone stock adjustment"
                              disabled={cloneAdjustment.isPending}
                              onClick={() => void onClone(row.id)}
                            >
                              <Copy className="size-3.5" />
                            </Button>
                          ) : undefined
                        }
                        onDelete={
                          row.available_actions.includes("delete") && canDelete
                            ? () => setDeleting(row)
                            : undefined
                        }
                      />
                    </TableCell>
                  ) : null}
                </TableRow>
              );
            })
          )}
        </TableBody>
      </DataTable>
      <ConfirmActionDialog
        open={Boolean(deleting)}
        title={`${STOCK_ADJUSTMENT_ACTION_LABELS.delete} stock adjustment ${deleting ? (stockAdjustmentDisplayNumber(deleting) ?? "adjustment") : "adjustment"}`}
        description={
          deleting
            ? stockAdjustmentActionEffect(
                "delete",
                stockAdjustmentDisplayNumber(deleting) ?? "adjustment",
              )
            : ""
        }
        confirmLabel={STOCK_ADJUSTMENT_ACTION_LABELS.delete}
        pending={deleteAdjustment.isPending}
        onOpenChange={(open) => {
          if (!open) {
            setDeleting(null);
          }
        }}
        onConfirm={() => void onDelete()}
      />
    </ListPage>
  );
}
