"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { useAllSuppliers } from "@/modules/erp/suppliers/queries";
import { useAllProducts } from "@/modules/inventory-management/products/queries";
import {
  useDeleteGoodsReceipt,
} from "@/modules/inventory-management/goods-receipts/mutations";
import { goodsReceiptPermissions } from "@/modules/inventory-management/goods-receipts/permissions";
import { useGoodsReceipts } from "@/modules/inventory-management/goods-receipts/queries";
import {
  QC_STATUS_LABELS,
  QC_STATUS_VARIANTS,
  QC_STATUSES,
  STOCK_DOCUMENT_STATUS_LABELS,
  STOCK_DOCUMENT_STATUS_VARIANTS,
  STOCK_DOCUMENT_STATUSES,
  goodsReceiptDisplayNumber,
  parseQcStatus,
  type GoodsReceipt,
  type StockDocumentStatus,
} from "@/modules/inventory-management/goods-receipts/schemas";
import { GOODS_RECEIPT_ACTION_REGISTRY } from "@/modules/inventory-management/goods-receipts/workflow";
import { useAllWarehouses } from "@/modules/inventory-management/warehouses/queries";
import { usePurchaseOrders } from "@/modules/erp/purchase-orders/queries";
import { purchaseOrderDisplayNumber } from "@/modules/erp/purchase-orders/schemas";
import { getErrorMessage } from "@/shared/api/errors";
import { emptyListMessage, useCrudPermissions } from "@/shared/auth/use-crud-permissions";
import { DataTable } from "@/shared/components/data-table/data-table";
import { DateRangeFilter } from "@/shared/components/data-table/date-range-filter";
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
import { DocumentStatusBadge } from "@/shared/components/document/document-status-badge";
import { getDocumentAction } from "@/shared/components/document/workflow-registry";
import { ListPage } from "@/shared/components/layout/list-page";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Button } from "@/shared/components/ui/button";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { TableBody, TableCell, TableHeader, TableRow } from "@/shared/components/ui/table";
import { useTableParams } from "@/shared/hooks/use-table-params";
import { formatDate } from "@/shared/lib/format";

const COLUMN_HEADERS = ["Number", "Date", "Supplier", "QC", "Status"] as const;
const ALL = "all";
const EMPTY_EXTRA = {
  warehouseId: ALL,
  purchaseOrderId: ALL,
  qcStatus: ALL,
  productId: ALL,
  documentDateFrom: "",
  documentDateTo: "",
};

function extraFromFilters(filters: Record<string, string | undefined>) {
  return {
    warehouseId: filters.warehouse_id ?? ALL,
    purchaseOrderId: filters.purchase_order_id ?? ALL,
    qcStatus: filters.qc_status ?? ALL,
    productId: filters.product_id ?? ALL,
    documentDateFrom: filters.document_date_from ?? "",
    documentDateTo: filters.document_date_to ?? "",
  };
}

function extraCountOf(extra: typeof EMPTY_EXTRA) {
  return [
    extra.warehouseId !== ALL,
    extra.purchaseOrderId !== ALL,
    extra.qcStatus !== ALL,
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

export function GoodsReceiptsScreen() {
  const { canCreate, canRead, canUpdate, canDelete } = useCrudPermissions(goodsReceiptPermissions);
  const { page, page_size, search, sort_by, sort_order, filters, setParams, setPage } =
    useTableParams();
  const extraFilters = extraFromFilters(filters);
  const extraCount = extraCountOf(extraFilters);
  const [draftExtra, setDraftExtra] = useState(EMPTY_EXTRA);
  const receiptsQuery = useGoodsReceipts({
    page,
    page_size,
    search,
    sort_by,
    sort_order,
    status: parseStatus(filters.status),
    supplier_id: filters.supplier_id,
    warehouse_id: filters.warehouse_id,
    purchase_order_id: filters.purchase_order_id,
    qc_status: parseQcStatus(filters.qc_status),
    product_id: filters.product_id,
    document_date_from: filters.document_date_from,
    document_date_to: filters.document_date_to,
  });
  const suppliersQuery = useAllSuppliers();
  const warehousesQuery = useAllWarehouses();
  const productsQuery = useAllProducts();
  const purchaseOrdersQuery = usePurchaseOrders({ page_size: 100 });
  const deleteReceipt = useDeleteGoodsReceipt();
  const [deleting, setDeleting] = useState<GoodsReceipt | null>(null);
  const rows = receiptsQuery.data?.data ?? [];
  const meta = receiptsQuery.data?.meta;
  const suppliers = suppliersQuery.data ?? [];
  const warehouses = warehousesQuery.data ?? [];
  const products = productsQuery.data ?? [];
  const purchaseOrders = purchaseOrdersQuery.data?.data ?? [];
  const supplierLabelById = new Map(suppliers.map((supplier) => [supplier.id, supplier.name]));
  const purchaseOrderLabelById = new Map(
    purchaseOrders.map((order) => [order.id, purchaseOrderDisplayNumber(order) ?? order.id]),
  );
  const showActions = hasRowActions(canRead, canUpdate, canCreate, canDelete);
  const headers = tableHeaders(COLUMN_HEADERS, showActions);

  async function onDelete() {
    if (!deleting) {
      return;
    }
    try {
      await deleteReceipt.mutateAsync({ id: deleting.id, version: deleting.version });
      toast.success("Goods receipt deleted");
      setDeleting(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <ListPage>
      <PageHeader
        title="Goods receipts"
        subtitle="Receive purchase orders and direct inbound stock"
        actions={
          canCreate ? (
            <Button type="button" size="sm" asChild>
              <Link href="/goods-receipts/new">
                <Plus className="size-3.5" />
                New goods receipt
              </Link>
            </Button>
          ) : undefined
        }
      />
      <DataTableToolbar>
        <ListSearch
          value={search ?? ""}
          onChange={(value) => setParams({ search: value || null })}
          placeholder="Search goods receipts…"
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
          placeholder="Supplier"
          value={filters.supplier_id ?? ALL}
          onValueChange={(value) =>
            setParams({ filters: { supplier_id: value === ALL ? null : value } })
          }
          options={[
            { value: ALL, label: "All suppliers" },
            ...suppliers.map((supplier) => ({
              value: supplier.id,
              label: supplier.name,
            })),
          ]}
        />
        <MoreFiltersDialog
          extraCount={extraCount}
          draftCount={extraCountOf(draftExtra)}
          description="Filter by warehouse, purchase order, QC status, product, and document date."
          onOpen={() => setDraftExtra(extraFilters)}
          onApply={() =>
            setParams({
              filters: {
                warehouse_id: draftExtra.warehouseId === ALL ? null : draftExtra.warehouseId,
                purchase_order_id:
                  draftExtra.purchaseOrderId === ALL ? null : draftExtra.purchaseOrderId,
                qc_status: draftExtra.qcStatus === ALL ? null : draftExtra.qcStatus,
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
          <FilterField label="Warehouse" htmlFor="grn-filter-warehouse">
            <FilterSelect
              id="grn-filter-warehouse"
              className="w-full"
              placeholder="Warehouse"
              value={draftExtra.warehouseId}
              onValueChange={(value) =>
                setDraftExtra((current) => ({ ...current, warehouseId: value }))
              }
              options={[
                { value: ALL, label: "All warehouses" },
                ...warehouses.map((warehouse) => ({
                  value: warehouse.id,
                  label: `${warehouse.code} — ${warehouse.name}`,
                })),
              ]}
            />
          </FilterField>
          <FilterField label="Purchase order" htmlFor="grn-filter-po">
            <FilterSelect
              id="grn-filter-po"
              className="w-full"
              placeholder="Purchase order"
              value={draftExtra.purchaseOrderId}
              onValueChange={(value) =>
                setDraftExtra((current) => ({ ...current, purchaseOrderId: value }))
              }
              options={[
                { value: ALL, label: "All purchase orders" },
                ...purchaseOrders.map((order) => ({
                  value: order.id,
                  label: purchaseOrderDisplayNumber(order) ?? order.id,
                })),
              ]}
            />
          </FilterField>
          <FilterField label="QC status" htmlFor="grn-filter-qc">
            <FilterSelect
              id="grn-filter-qc"
              className="w-full"
              placeholder="QC status"
              value={draftExtra.qcStatus}
              onValueChange={(value) =>
                setDraftExtra((current) => ({ ...current, qcStatus: value }))
              }
              options={[
                { value: ALL, label: "All QC statuses" },
                ...QC_STATUSES.map((status) => ({
                  value: status,
                  label: QC_STATUS_LABELS[status],
                })),
              ]}
            />
          </FilterField>
          <FilterField label="Product" htmlFor="grn-filter-product">
            <FilterSelect
              id="grn-filter-product"
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
          <DateRangeFilter
            fromId="grn-filter-from"
            toId="grn-filter-to"
            from={draftExtra.documentDateFrom}
            to={draftExtra.documentDateTo}
            onFromChange={(value) =>
              setDraftExtra((current) => ({ ...current, documentDateFrom: value }))
            }
            onToChange={(value) =>
              setDraftExtra((current) => ({ ...current, documentDateTo: value }))
            }
          />
        </MoreFiltersDialog>
        <SortDialog
          fields={[...SORT_FIELDS]}
          sortBy={sort_by}
          sortOrder={sort_order}
          onApply={setParams}
        />
        {search || filters.status || filters.supplier_id || extraCount > 0 || sort_by ? (
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
                  supplier_id: null,
                  warehouse_id: null,
                  purchase_order_id: null,
                  qc_status: null,
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
          {receiptsQuery.isLoading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell colSpan={headers.length}>
                  <Skeleton className="h-6 w-full" />
                </TableCell>
              </TableRow>
            ))
          ) : receiptsQuery.isError ? (
            <TableRow>
              <TableCell colSpan={headers.length}>
                <DataTableError
                  message={getErrorMessage(receiptsQuery.error)}
                  onRetry={() => receiptsQuery.refetch()}
                />
              </TableCell>
            </TableRow>
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={headers.length}>
                <DataTableEmpty
                  title="No goods receipts"
                  message={emptyListMessage(canCreate, "Create a goods receipt to get started.")}
                />
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => {
              const number = goodsReceiptDisplayNumber(row);
              return (
                <TableRow key={row.id}>
                  <TableCell className="font-mono text-sm">
                    <RecordLink href={`/goods-receipts/${row.id}`}>{number ?? "—"}</RecordLink>
                  </TableCell>
                  <TableCell>{formatDate(row.document_date)}</TableCell>
                  <TableCell>
                    {row.purchase_order_id ? (
                      <span>
                        {supplierLabelById.get(row.supplier_id) ?? "—"}
                        {purchaseOrderLabelById.get(row.purchase_order_id) ? (
                          <span className="text-muted-foreground">
                            {" "}
                            ({purchaseOrderLabelById.get(row.purchase_order_id)})
                          </span>
                        ) : null}
                      </span>
                    ) : (
                      (supplierLabelById.get(row.supplier_id) ?? "—")
                    )}
                  </TableCell>
                  <TableCell>
                    <DocumentStatusBadge
                      status={row.qc_status}
                      labels={QC_STATUS_LABELS}
                      variants={QC_STATUS_VARIANTS}
                    />
                  </TableCell>
                  <TableCell>
                    <DocumentStatusBadge
                      status={row.status}
                      labels={STOCK_DOCUMENT_STATUS_LABELS}
                      variants={STOCK_DOCUMENT_STATUS_VARIANTS}
                    />
                  </TableCell>
                  {showActions ? (
                    <TableCell>
                      <DataTableRowActions
                        entityName={number ?? "goods receipt"}
                        viewHref={canRead ? `/goods-receipts/${row.id}` : undefined}
                        editHref={
                          canUpdate && row.status === "DRAFT"
                            ? `/goods-receipts/${row.id}/edit`
                            : undefined
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
        title={`${getDocumentAction(GOODS_RECEIPT_ACTION_REGISTRY, "delete").label} goods receipt ${deleting ? (goodsReceiptDisplayNumber(deleting) ?? "goods receipt") : "goods receipt"}`}
        description={
          deleting
            ? (getDocumentAction(GOODS_RECEIPT_ACTION_REGISTRY, "delete").confirmCopy?.(
                goodsReceiptDisplayNumber(deleting) ?? "goods receipt",
              ) ?? "")
            : ""
        }
        confirmLabel={getDocumentAction(GOODS_RECEIPT_ACTION_REGISTRY, "delete").label}
        pending={deleteReceipt.isPending}
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
