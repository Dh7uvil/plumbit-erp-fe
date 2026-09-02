"use client";

import { Copy, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { useAllProducts } from "@/modules/inventory-management/products/queries";
import { StockTransferStatusBadge } from "@/modules/inventory-management/stock-transfers/components/stock-transfer-status-badge";
import {
  useCloneStockTransfer,
  useDeleteStockTransfer,
} from "@/modules/inventory-management/stock-transfers/mutations";
import { stockTransferPermissions } from "@/modules/inventory-management/stock-transfers/permissions";
import { useStockTransfers } from "@/modules/inventory-management/stock-transfers/queries";
import {
  STOCK_DOCUMENT_STATUS_LABELS,
  STOCK_DOCUMENT_STATUSES,
  stockTransferDisplayNumber,
  type StockDocumentStatus,
  type StockTransfer,
} from "@/modules/inventory-management/stock-transfers/schemas";
import {
  STOCK_TRANSFER_ACTION_LABELS,
  stockTransferActionEffect,
} from "@/modules/inventory-management/stock-transfers/workflow";
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

const COLUMN_HEADERS = ["Number", "Date", "From", "To", "Status"] as const;
const ALL = "all";
const EMPTY_EXTRA = {
  toWarehouseId: ALL,
  branchId: ALL,
  productId: ALL,
  documentDateFrom: "",
  documentDateTo: "",
};

function extraFromFilters(filters: Record<string, string | undefined>) {
  return {
    toWarehouseId: filters.to_warehouse_id ?? ALL,
    branchId: filters.branch_id ?? ALL,
    productId: filters.product_id ?? ALL,
    documentDateFrom: filters.document_date_from ?? "",
    documentDateTo: filters.document_date_to ?? "",
  };
}

function extraCountOf(extra: typeof EMPTY_EXTRA) {
  return [
    extra.toWarehouseId !== ALL,
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

export function StockTransfersScreen() {
  const { canCreate, canRead, canUpdate, canDelete } = useCrudPermissions(stockTransferPermissions);
  const router = useRouter();
  const { page, page_size, search, sort_by, sort_order, filters, setParams, setPage } =
    useTableParams();
  const extraFilters = extraFromFilters(filters);
  const extraCount = extraCountOf(extraFilters);
  const [draftExtra, setDraftExtra] = useState(EMPTY_EXTRA);
  const transfersQuery = useStockTransfers({
    page,
    page_size,
    search,
    sort_by,
    sort_order,
    status: parseStatus(filters.status),
    from_warehouse_id: filters.from_warehouse_id,
    to_warehouse_id: filters.to_warehouse_id,
    branch_id: filters.branch_id,
    product_id: filters.product_id,
    document_date_from: filters.document_date_from,
    document_date_to: filters.document_date_to,
  });
  const warehousesQuery = useAllWarehouses();
  const productsQuery = useAllProducts();
  const branchesQuery = useAllBranches();
  const cloneTransfer = useCloneStockTransfer();
  const deleteTransfer = useDeleteStockTransfer();
  const [deleting, setDeleting] = useState<StockTransfer | null>(null);
  const rows = transfersQuery.data?.data ?? [];
  const meta = transfersQuery.data?.meta;
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
      const cloned = await cloneTransfer.mutateAsync(id);
      toast.success("Stock transfer cloned");
      router.push(`/stock-transfers/${cloned.id}`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  async function onDelete() {
    if (!deleting) {
      return;
    }
    try {
      await deleteTransfer.mutateAsync({ id: deleting.id, version: deleting.version });
      toast.success("Stock transfer deleted");
      setDeleting(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <ListPage>
      <PageHeader
        title="Stock transfers"
        subtitle="Move quantity between warehouses"
        actions={
          canCreate ? (
            <Button type="button" size="sm" asChild>
              <Link href="/stock-transfers/new">
                <Plus className="size-3.5" />
                New transfer
              </Link>
            </Button>
          ) : undefined
        }
      />
      <DataTableToolbar>
        <ListSearch
          value={search ?? ""}
          onChange={(value) => setParams({ search: value || null })}
          placeholder="Search transfers…"
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
          placeholder="From warehouse"
          value={filters.from_warehouse_id ?? ALL}
          onValueChange={(value) =>
            setParams({ filters: { from_warehouse_id: value === ALL ? null : value } })
          }
          options={[
            { value: ALL, label: "All sources" },
            ...warehouses.map((warehouse) => ({
              value: warehouse.id,
              label: `${warehouse.code} — ${warehouse.name}`,
            })),
          ]}
        />
        <MoreFiltersDialog
          extraCount={extraCount}
          draftCount={extraCountOf(draftExtra)}
          description="Filter by destination warehouse, branch, product, and document date."
          onOpen={() => setDraftExtra(extraFilters)}
          onApply={() =>
            setParams({
              filters: {
                to_warehouse_id: draftExtra.toWarehouseId === ALL ? null : draftExtra.toWarehouseId,
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
          <FilterField label="To warehouse" htmlFor="transfer-filter-to">
            <FilterSelect
              id="transfer-filter-to"
              className="w-full"
              placeholder="To warehouse"
              value={draftExtra.toWarehouseId}
              onValueChange={(value) =>
                setDraftExtra((current) => ({ ...current, toWarehouseId: value }))
              }
              options={[
                { value: ALL, label: "All destinations" },
                ...warehouses.map((warehouse) => ({
                  value: warehouse.id,
                  label: `${warehouse.code} — ${warehouse.name}`,
                })),
              ]}
            />
          </FilterField>
          <FilterField label="Branch" htmlFor="transfer-filter-branch">
            <FilterSelect
              id="transfer-filter-branch"
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
          <FilterField label="Product" htmlFor="transfer-filter-product">
            <FilterSelect
              id="transfer-filter-product"
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
          <FilterField label="From date" htmlFor="transfer-filter-from">
            <Input
              id="transfer-filter-from"
              type="date"
              value={draftExtra.documentDateFrom}
              onChange={(event) =>
                setDraftExtra((current) => ({ ...current, documentDateFrom: event.target.value }))
              }
            />
          </FilterField>
          <FilterField label="To date" htmlFor="transfer-filter-to-date">
            <Input
              id="transfer-filter-to-date"
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
        {search || filters.status || filters.from_warehouse_id || extraCount > 0 || sort_by ? (
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
                  from_warehouse_id: null,
                  to_warehouse_id: null,
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
          {transfersQuery.isLoading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell colSpan={headers.length}>
                  <Skeleton className="h-6 w-full" />
                </TableCell>
              </TableRow>
            ))
          ) : transfersQuery.isError ? (
            <TableRow>
              <TableCell colSpan={headers.length}>
                <DataTableError
                  message={getErrorMessage(transfersQuery.error)}
                  onRetry={() => transfersQuery.refetch()}
                />
              </TableCell>
            </TableRow>
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={headers.length}>
                <DataTableEmpty
                  title="No stock transfers"
                  message={emptyListMessage(canCreate, "Create a transfer to get started.")}
                />
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => {
              const number = stockTransferDisplayNumber(row);
              return (
                <TableRow key={row.id}>
                  <TableCell className="font-mono text-sm">
                    <RecordLink href={`/stock-transfers/${row.id}`}>{number ?? "—"}</RecordLink>
                  </TableCell>
                  <TableCell>{formatDate(row.document_date)}</TableCell>
                  <TableCell>{warehouseLabelById.get(row.from_warehouse_id) ?? "—"}</TableCell>
                  <TableCell>{warehouseLabelById.get(row.to_warehouse_id) ?? "—"}</TableCell>
                  <TableCell>
                    <StockTransferStatusBadge status={row.status} />
                  </TableCell>
                  {showActions ? (
                    <TableCell>
                      <DataTableRowActions
                        entityName={number ?? "transfer"}
                        viewHref={canRead ? `/stock-transfers/${row.id}` : undefined}
                        editHref={
                          canUpdate && row.status === "DRAFT"
                            ? `/stock-transfers/${row.id}/edit`
                            : undefined
                        }
                        extra={
                          row.available_actions.includes("clone") && canCreate ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="size-7"
                              aria-label="Clone stock transfer"
                              disabled={cloneTransfer.isPending}
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
        title={`${STOCK_TRANSFER_ACTION_LABELS.delete} stock transfer ${deleting ? (stockTransferDisplayNumber(deleting) ?? "transfer") : "transfer"}`}
        description={
          deleting
            ? stockTransferActionEffect(
                "delete",
                stockTransferDisplayNumber(deleting) ?? "transfer",
              )
            : ""
        }
        confirmLabel={STOCK_TRANSFER_ACTION_LABELS.delete}
        pending={deleteTransfer.isPending}
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
