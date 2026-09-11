"use client";

import { Copy, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { ClonePurchaseOrderDialog } from "@/modules/erp/purchase-orders/components/clone-purchase-order-dialog";
import { useAllSuppliers } from "@/modules/erp/suppliers/queries";
import { useAllCurrencies } from "@/modules/erp/currencies/queries";
import { DocumentStatusBadge } from "@/shared/components/document/document-status-badge";
import { getDocumentAction } from "@/shared/components/document/workflow-registry";
import { PURCHASE_ORDER_ACTION_REGISTRY } from "@/modules/erp/purchase-orders/workflow";
import {
  useClonePurchaseOrder,
  useDeletePurchaseOrder,
} from "@/modules/erp/purchase-orders/mutations";
import { purchaseOrderPermissions } from "@/modules/erp/purchase-orders/permissions";
import { usePurchaseOrders } from "@/modules/erp/purchase-orders/queries";
import {
  BILLING_STATUS_LABELS,
  BILLING_STATUS_VARIANTS,
  BILLING_STATUSES,
  RECEIPT_STATUS_LABELS,
  RECEIPT_STATUS_VARIANTS,
  RECEIPT_STATUSES,
  PURCHASE_ORDER_STATUS_LABELS,
  PURCHASE_ORDER_STATUS_VARIANTS,
  PURCHASE_ORDER_STATUSES,
  purchaseOrderDisplayNumber,
  type BillingStatus,
  type ReceiptStatus,
  type PurchaseOrder,
  type PurchaseOrderStatus,
} from "@/modules/erp/purchase-orders/schemas";
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
import {
  CONVERT_FROM_MENU_CLASSNAME,
  CONVERT_FROM_TRIGGER_CLASSNAME,
} from "@/shared/components/document/convert-from-menu";
import { ConfirmActionDialog } from "@/shared/components/feedback/confirm-action-dialog";
import { DataTableToolbar } from "@/shared/components/data-table/toolbar";
import { ListPage } from "@/shared/components/layout/list-page";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Button } from "@/shared/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { TableBody, TableCell, TableHeader, TableRow } from "@/shared/components/ui/table";
import { useTableParams } from "@/shared/hooks/use-table-params";
import { formatDate, formatMoney } from "@/shared/lib/format";

const COLUMN_HEADERS = ["Number", "Supplier", "Date", "Status", "Grand total"] as const;
const ALL = "all";
const SORT_FIELDS = [
  { value: "document_number", label: "Number" },
  { value: "order_date", label: "Date" },
  { value: "status", label: "Status" },
  { value: "grand_total", label: "Grand total" },
] as const;
const SORT_FIELD_BY_HEADER: Partial<Record<string, string>> = {
  Number: "document_number",
  Date: "order_date",
  Status: "status",
  "Grand total": "grand_total",
};

function parseStatus(value: string | undefined): PurchaseOrderStatus | undefined {
  return PURCHASE_ORDER_STATUSES.includes(value as PurchaseOrderStatus)
    ? (value as PurchaseOrderStatus)
    : undefined;
}

function parseFulfillment(value: string | undefined): ReceiptStatus | undefined {
  return RECEIPT_STATUSES.includes(value as ReceiptStatus) ? (value as ReceiptStatus) : undefined;
}

function parseBilling(value: string | undefined): BillingStatus | undefined {
  return BILLING_STATUSES.includes(value as BillingStatus) ? (value as BillingStatus) : undefined;
}

export function PurchaseOrdersScreen() {
  const { canCreate, canRead, canUpdate, canDelete } = useCrudPermissions(purchaseOrderPermissions);
  const router = useRouter();
  const { page, page_size, search, sort_by, sort_order, filters, setParams, setPage } =
    useTableParams();
  const extraFilters = {
    fulfillmentStatus: filters.receipt_status ?? ALL,
    billingStatus: filters.billing_status ?? ALL,
    branchId: filters.branch_id ?? ALL,
    warehouseId: filters.warehouse_id ?? ALL,
    currencyId: filters.currency_id ?? ALL,
  };
  const extraCount = [
    extraFilters.fulfillmentStatus !== ALL,
    extraFilters.billingStatus !== ALL,
    extraFilters.branchId !== ALL,
    extraFilters.warehouseId !== ALL,
    extraFilters.currencyId !== ALL,
  ].filter(Boolean).length;
  const [draftExtra, setDraftExtra] = useState({
    fulfillmentStatus: ALL,
    billingStatus: ALL,
    branchId: ALL,
    warehouseId: ALL,
    currencyId: ALL,
  });
  const purchaseOrdersQuery = usePurchaseOrders({
    page,
    page_size,
    search,
    sort_by,
    sort_order,
    status: parseStatus(filters.status),
    receipt_status: parseFulfillment(filters.receipt_status),
    billing_status: parseBilling(filters.billing_status),
    supplier_id: filters.supplier_id,
    branch_id: filters.branch_id,
    warehouse_id: filters.warehouse_id,
    currency_id: filters.currency_id,
    source_sales_order_id: filters.source_sales_order_id,
  });
  const suppliersQuery = useAllSuppliers();
  const currenciesQuery = useAllCurrencies();
  const branchesQuery = useAllBranches();
  const warehousesQuery = useAllWarehouses();
  const clonePurchaseOrder = useClonePurchaseOrder();
  const deletePurchaseOrder = useDeletePurchaseOrder();
  const [deleting, setDeleting] = useState<PurchaseOrder | null>(null);
  const [fromClone, setFromClone] = useState(false);

  const rows = purchaseOrdersQuery.data?.data ?? [];
  const meta = purchaseOrdersQuery.data?.meta;
  const suppliers = suppliersQuery.data ?? [];
  const currencies = currenciesQuery.data ?? [];
  const branches = branchesQuery.data ?? [];
  const warehouses = warehousesQuery.data ?? [];
  const supplierNameById = new Map(suppliers.map((supplier) => [supplier.id, supplier.name]));
  const currencyCodeById = new Map(currencies.map((currency) => [currency.id, currency.code]));
  const showActions = hasRowActions(canRead, canUpdate, canCreate, canDelete);
  const headers = tableHeaders(COLUMN_HEADERS, showActions);

  async function onClone(id: string) {
    try {
      const cloned = await clonePurchaseOrder.mutateAsync(id);
      toast.success("PurchaseOrder cloned");
      router.push(`/purchase-orders/${cloned.id}`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  async function onDelete() {
    if (!deleting) {
      return;
    }
    try {
      await deletePurchaseOrder.mutateAsync({ id: deleting.id, version: deleting.version });
      toast.success("PurchaseOrder deleted");
      setDeleting(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <ListPage>
      <PageHeader
        title="PurchaseOrders"
        subtitle="Supplier orders with server-side totals"
        actions={
          canCreate ? (
            <div className="flex flex-wrap gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className={CONVERT_FROM_TRIGGER_CLASSNAME}
                  >
                    Convert from
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className={CONVERT_FROM_MENU_CLASSNAME}>
                  <DropdownMenuItem onSelect={() => setFromClone(true)}>
                    Purchase order
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button type="button" size="sm" asChild>
                <Link href="/purchase-orders/new">
                  <Plus className="size-3.5" />
                  New purchase order
                </Link>
              </Button>
            </div>
          ) : undefined
        }
      />
      <DataTableToolbar>
        <ListSearch
          value={search ?? ""}
          onChange={(value) => setParams({ search: value || null })}
          placeholder="Search purchase orders…"
        />
        <FilterSelect
          className="w-44"
          placeholder="Status"
          value={filters.status ?? ALL}
          onValueChange={(value) =>
            setParams({ filters: { status: value === ALL ? null : value } })
          }
          options={[
            { value: ALL, label: "All statuses" },
            ...PURCHASE_ORDER_STATUSES.map((status) => ({
              value: status,
              label: PURCHASE_ORDER_STATUS_LABELS[status],
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
            ...suppliers.map((supplier) => ({ value: supplier.id, label: supplier.name })),
          ]}
        />
        <MoreFiltersDialog
          extraCount={extraCount}
          draftCount={
            [
              draftExtra.fulfillmentStatus !== ALL,
              draftExtra.billingStatus !== ALL,
              draftExtra.branchId !== ALL,
              draftExtra.warehouseId !== ALL,
              draftExtra.currencyId !== ALL,
            ].filter(Boolean).length
          }
          description="Filter by receipt, billing, branch, warehouse and currency."
          onOpen={() => setDraftExtra(extraFilters)}
          onApply={() =>
            setParams({
              filters: {
                receipt_status:
                  draftExtra.fulfillmentStatus === ALL ? null : draftExtra.fulfillmentStatus,
                billing_status: draftExtra.billingStatus === ALL ? null : draftExtra.billingStatus,
                branch_id: draftExtra.branchId === ALL ? null : draftExtra.branchId,
                warehouse_id: draftExtra.warehouseId === ALL ? null : draftExtra.warehouseId,
                currency_id: draftExtra.currencyId === ALL ? null : draftExtra.currencyId,
              },
            })
          }
          onClearDraft={() =>
            setDraftExtra({
              fulfillmentStatus: ALL,
              billingStatus: ALL,
              branchId: ALL,
              warehouseId: ALL,
              currencyId: ALL,
            })
          }
        >
          <FilterField label="Receipt" htmlFor="purchase-order-filter-receipt">
            <FilterSelect
              id="purchase-order-filter-receipt"
              className="w-full"
              placeholder="Receipt"
              value={draftExtra.fulfillmentStatus}
              onValueChange={(value) =>
                setDraftExtra((current) => ({ ...current, fulfillmentStatus: value }))
              }
              options={[
                { value: ALL, label: "All receipt statuses" },
                ...RECEIPT_STATUSES.map((status) => ({
                  value: status,
                  label: RECEIPT_STATUS_LABELS[status],
                })),
              ]}
            />
          </FilterField>
          <FilterField label="Billing" htmlFor="purchase-order-filter-billing">
            <FilterSelect
              id="purchase-order-filter-billing"
              className="w-full"
              placeholder="Billing"
              value={draftExtra.billingStatus}
              onValueChange={(value) =>
                setDraftExtra((current) => ({ ...current, billingStatus: value }))
              }
              options={[
                { value: ALL, label: "All billing" },
                ...BILLING_STATUSES.map((status) => ({
                  value: status,
                  label: BILLING_STATUS_LABELS[status],
                })),
              ]}
            />
          </FilterField>
          <FilterField label="Branch" htmlFor="purchase-order-filter-branch">
            <FilterSelect
              id="purchase-order-filter-branch"
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
          <FilterField label="Warehouse" htmlFor="purchase-order-filter-warehouse">
            <FilterSelect
              id="purchase-order-filter-warehouse"
              className="w-full"
              placeholder="Warehouse"
              value={draftExtra.warehouseId}
              onValueChange={(value) =>
                setDraftExtra((current) => ({ ...current, warehouseId: value }))
              }
              options={[
                { value: ALL, label: "All warehouses" },
                ...warehouses.map((warehouse) => ({ value: warehouse.id, label: warehouse.name })),
              ]}
            />
          </FilterField>
          <FilterField label="Currency" htmlFor="purchase-order-filter-currency">
            <FilterSelect
              id="purchase-order-filter-currency"
              className="w-full"
              placeholder="Currency"
              value={draftExtra.currencyId}
              onValueChange={(value) =>
                setDraftExtra((current) => ({ ...current, currencyId: value }))
              }
              options={[
                { value: ALL, label: "All currencies" },
                ...currencies.map((currency) => ({ value: currency.id, label: currency.code })),
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
        {search ||
        filters.status ||
        filters.supplier_id ||
        filters.source_sales_order_id ||
        extraCount > 0 ||
        sort_by ? (
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
                  receipt_status: null,
                  billing_status: null,
                  branch_id: null,
                  warehouse_id: null,
                  currency_id: null,
                  source_sales_order_id: null,
                },
              })
            }
          >
            Clear
          </Button>
        ) : null}
      </DataTableToolbar>
      {filters.source_sales_order_id ? (
        <p className="text-muted-foreground text-sm">
          Showing purchase orders raised for{" "}
          <Link
            href={`/sales-orders/${filters.source_sales_order_id}`}
            className="text-foreground underline-offset-4 hover:underline"
          >
            sales order
          </Link>
          .
        </p>
      ) : null}
      <DataTable footer={meta ? <DataTablePagination meta={meta} onPageChange={setPage} /> : null}>
        <TableHeader>
          <TableRow>
            <SortableHeads
              headers={headers}
              fieldByHeader={SORT_FIELD_BY_HEADER}
              sortBy={sort_by}
              sortOrder={sort_order}
              onSort={setParams}
              classNameByHeader={{ "Grand total": "text-right" }}
            />
          </TableRow>
        </TableHeader>
        <TableBody>
          {purchaseOrdersQuery.isLoading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell colSpan={headers.length}>
                  <Skeleton className="h-6 w-full" />
                </TableCell>
              </TableRow>
            ))
          ) : purchaseOrdersQuery.isError ? (
            <TableRow>
              <TableCell colSpan={headers.length}>
                <DataTableError
                  message={getErrorMessage(purchaseOrdersQuery.error)}
                  onRetry={() => purchaseOrdersQuery.refetch()}
                />
              </TableCell>
            </TableRow>
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={headers.length}>
                <DataTableEmpty
                  title="No purchase orders"
                  message={emptyListMessage(canCreate, "Create a purchase order to get started.")}
                />
              </TableCell>
            </TableRow>
          ) : (
            rows.map((purchaseOrder) => {
              const number = purchaseOrderDisplayNumber(purchaseOrder);
              const currencyCode = currencyCodeById.get(purchaseOrder.currency_id) ?? "";
              return (
                <TableRow key={purchaseOrder.id}>
                  <TableCell className="font-mono text-sm">
                    <RecordLink href={`/purchase-orders/${purchaseOrder.id}`}>
                      {number ?? "—"}
                    </RecordLink>
                  </TableCell>
                  <TableCell className="font-medium">
                    <RecordLink href={`/purchase-orders/${purchaseOrder.id}`}>
                      {supplierNameById.get(purchaseOrder.supplier_id) ?? "—"}
                    </RecordLink>
                  </TableCell>
                  <TableCell>{formatDate(purchaseOrder.order_date)}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap items-center gap-1">
                      <DocumentStatusBadge
                        status={purchaseOrder.status}
                        labels={PURCHASE_ORDER_STATUS_LABELS}
                        variants={PURCHASE_ORDER_STATUS_VARIANTS}
                      />
                      <DocumentStatusBadge
                        status={purchaseOrder.receipt_status}
                        labels={RECEIPT_STATUS_LABELS}
                        variants={RECEIPT_STATUS_VARIANTS}
                      />
                      <DocumentStatusBadge
                        status={purchaseOrder.billing_status}
                        labels={BILLING_STATUS_LABELS}
                        variants={BILLING_STATUS_VARIANTS}
                      />
                    </div>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatMoney(purchaseOrder.grand_total, currencyCode)}
                  </TableCell>
                  {showActions ? (
                    <TableCell>
                      <DataTableRowActions
                        entityName={number ?? "purchase order"}
                        viewHref={canRead ? `/purchase-orders/${purchaseOrder.id}` : undefined}
                        editHref={
                          canUpdate && purchaseOrder.status === "DRAFT"
                            ? `/purchase-orders/${purchaseOrder.id}/edit`
                            : undefined
                        }
                        extra={
                          purchaseOrder.available_actions.includes("clone") && canCreate ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="size-7"
                              aria-label="Clone purchase order"
                              disabled={clonePurchaseOrder.isPending}
                              onClick={() => void onClone(purchaseOrder.id)}
                            >
                              <Copy className="size-3.5" />
                            </Button>
                          ) : undefined
                        }
                        onDelete={
                          purchaseOrder.available_actions.includes("delete") && canDelete
                            ? () => setDeleting(purchaseOrder)
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
        title={`${getDocumentAction(PURCHASE_ORDER_ACTION_REGISTRY, "delete").label} purchase order ${deleting ? (purchaseOrderDisplayNumber(deleting) ?? "purchase order") : "purchase order"}`}
        description={
          deleting
            ? (getDocumentAction(PURCHASE_ORDER_ACTION_REGISTRY, "delete").confirmCopy?.(
                purchaseOrderDisplayNumber(deleting) ?? "purchase order",
              ) ?? "")
            : ""
        }
        confirmLabel={getDocumentAction(PURCHASE_ORDER_ACTION_REGISTRY, "delete").label}
        pending={deletePurchaseOrder.isPending}
        onOpenChange={(open) => {
          if (!open) {
            setDeleting(null);
          }
        }}
        onConfirm={() => void onDelete()}
      />
      <ClonePurchaseOrderDialog open={fromClone} onOpenChange={setFromClone} />
    </ListPage>
  );
}
