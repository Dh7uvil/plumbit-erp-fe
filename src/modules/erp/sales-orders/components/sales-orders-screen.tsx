"use client";

import { Copy, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { useAllCustomers } from "@/modules/crm/customers/queries";
import { useAllCurrencies } from "@/modules/erp/currencies/queries";
import { DocumentStatusBadge } from "@/shared/components/document/document-status-badge";
import { getDocumentAction } from "@/shared/components/document/workflow-registry";
import { SALES_ORDER_ACTION_REGISTRY } from "@/modules/erp/sales-orders/workflow";
import { useCloneSalesOrder, useDeleteSalesOrder } from "@/modules/erp/sales-orders/mutations";
import { salesOrderPermissions } from "@/modules/erp/sales-orders/permissions";
import { useSalesOrders } from "@/modules/erp/sales-orders/queries";
import {
  BILLING_STATUS_LABELS,
  BILLING_STATUS_VARIANTS,
  BILLING_STATUSES,
  FULFILLMENT_STATUS_LABELS,
  FULFILLMENT_STATUS_VARIANTS,
  FULFILLMENT_STATUSES,
  SALES_ORDER_STATUS_LABELS,
  SALES_ORDER_STATUS_VARIANTS,
  SALES_ORDER_STATUSES,
  salesOrderDisplayNumber,
  type BillingStatus,
  type FulfillmentStatus,
  type SalesOrder,
  type SalesOrderStatus,
} from "@/modules/erp/sales-orders/schemas";
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
import { Skeleton } from "@/shared/components/ui/skeleton";
import { TableBody, TableCell, TableHeader, TableRow } from "@/shared/components/ui/table";
import { useTableParams } from "@/shared/hooks/use-table-params";
import { formatDate, formatMoney } from "@/shared/lib/format";

const COLUMN_HEADERS = ["Number", "Customer", "Date", "Status", "Grand total"] as const;
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

function parseStatus(value: string | undefined): SalesOrderStatus | undefined {
  return SALES_ORDER_STATUSES.includes(value as SalesOrderStatus)
    ? (value as SalesOrderStatus)
    : undefined;
}

function parseFulfillment(value: string | undefined): FulfillmentStatus | undefined {
  return FULFILLMENT_STATUSES.includes(value as FulfillmentStatus)
    ? (value as FulfillmentStatus)
    : undefined;
}

function parseBilling(value: string | undefined): BillingStatus | undefined {
  return BILLING_STATUSES.includes(value as BillingStatus) ? (value as BillingStatus) : undefined;
}

export function SalesOrdersScreen() {
  const { canCreate, canRead, canUpdate, canDelete } = useCrudPermissions(salesOrderPermissions);
  const router = useRouter();
  const { page, page_size, search, sort_by, sort_order, filters, setParams, setPage } =
    useTableParams();
  const extraFilters = {
    fulfillmentStatus: filters.fulfillment_status ?? ALL,
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
  const salesOrdersQuery = useSalesOrders({
    page,
    page_size,
    search,
    sort_by,
    sort_order,
    status: parseStatus(filters.status),
    fulfillment_status: parseFulfillment(filters.fulfillment_status),
    billing_status: parseBilling(filters.billing_status),
    customer_id: filters.customer_id,
    branch_id: filters.branch_id,
    warehouse_id: filters.warehouse_id,
    currency_id: filters.currency_id,
  });
  const customersQuery = useAllCustomers();
  const currenciesQuery = useAllCurrencies();
  const branchesQuery = useAllBranches();
  const warehousesQuery = useAllWarehouses();
  const cloneSalesOrder = useCloneSalesOrder();
  const deleteSalesOrder = useDeleteSalesOrder();
  const [deleting, setDeleting] = useState<SalesOrder | null>(null);

  const rows = salesOrdersQuery.data?.data ?? [];
  const meta = salesOrdersQuery.data?.meta;
  const customers = customersQuery.data ?? [];
  const currencies = currenciesQuery.data ?? [];
  const branches = branchesQuery.data ?? [];
  const warehouses = warehousesQuery.data ?? [];
  const customerNameById = new Map(customers.map((customer) => [customer.id, customer.name]));
  const currencyCodeById = new Map(currencies.map((currency) => [currency.id, currency.code]));
  const showActions = hasRowActions(canRead, canUpdate, canCreate, canDelete);
  const headers = tableHeaders(COLUMN_HEADERS, showActions);

  async function onClone(id: string) {
    try {
      const cloned = await cloneSalesOrder.mutateAsync(id);
      toast.success("SalesOrder cloned");
      router.push(`/sales-orders/${cloned.id}`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  async function onDelete() {
    if (!deleting) {
      return;
    }
    try {
      await deleteSalesOrder.mutateAsync({ id: deleting.id, version: deleting.version });
      toast.success("SalesOrder deleted");
      setDeleting(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <ListPage>
      <PageHeader
        title="SalesOrders"
        subtitle="Customer orders with server-side totals"
        actions={
          canCreate ? (
            <Button type="button" size="sm" asChild>
              <Link href="/sales-orders/new">
                <Plus className="size-3.5" />
                New sales order
              </Link>
            </Button>
          ) : undefined
        }
      />
      <DataTableToolbar>
        <ListSearch
          value={search ?? ""}
          onChange={(value) => setParams({ search: value || null })}
          placeholder="Search sales orders…"
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
            ...SALES_ORDER_STATUSES.map((status) => ({
              value: status,
              label: SALES_ORDER_STATUS_LABELS[status],
            })),
          ]}
        />
        <FilterSelect
          className="w-48"
          placeholder="Customer"
          value={filters.customer_id ?? ALL}
          onValueChange={(value) =>
            setParams({ filters: { customer_id: value === ALL ? null : value } })
          }
          options={[
            { value: ALL, label: "All customers" },
            ...customers.map((customer) => ({ value: customer.id, label: customer.name })),
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
          description="Filter by fulfillment, billing, branch, warehouse and currency."
          onOpen={() => setDraftExtra(extraFilters)}
          onApply={() =>
            setParams({
              filters: {
                fulfillment_status:
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
          <FilterField label="Fulfillment" htmlFor="sales-order-filter-fulfillment">
            <FilterSelect
              id="sales-order-filter-fulfillment"
              className="w-full"
              placeholder="Fulfillment"
              value={draftExtra.fulfillmentStatus}
              onValueChange={(value) =>
                setDraftExtra((current) => ({ ...current, fulfillmentStatus: value }))
              }
              options={[
                { value: ALL, label: "All fulfillment" },
                ...FULFILLMENT_STATUSES.map((status) => ({
                  value: status,
                  label: FULFILLMENT_STATUS_LABELS[status],
                })),
              ]}
            />
          </FilterField>
          <FilterField label="Billing" htmlFor="sales-order-filter-billing">
            <FilterSelect
              id="sales-order-filter-billing"
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
          <FilterField label="Branch" htmlFor="sales-order-filter-branch">
            <FilterSelect
              id="sales-order-filter-branch"
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
          <FilterField label="Warehouse" htmlFor="sales-order-filter-warehouse">
            <FilterSelect
              id="sales-order-filter-warehouse"
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
          <FilterField label="Currency" htmlFor="sales-order-filter-currency">
            <FilterSelect
              id="sales-order-filter-currency"
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
        {search || filters.status || filters.customer_id || extraCount > 0 || sort_by ? (
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
                  customer_id: null,
                  fulfillment_status: null,
                  billing_status: null,
                  branch_id: null,
                  warehouse_id: null,
                  currency_id: null,
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
              classNameByHeader={{ "Grand total": "text-right" }}
            />
          </TableRow>
        </TableHeader>
        <TableBody>
          {salesOrdersQuery.isLoading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell colSpan={headers.length}>
                  <Skeleton className="h-6 w-full" />
                </TableCell>
              </TableRow>
            ))
          ) : salesOrdersQuery.isError ? (
            <TableRow>
              <TableCell colSpan={headers.length}>
                <DataTableError
                  message={getErrorMessage(salesOrdersQuery.error)}
                  onRetry={() => salesOrdersQuery.refetch()}
                />
              </TableCell>
            </TableRow>
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={headers.length}>
                <DataTableEmpty
                  title="No sales orders"
                  message={emptyListMessage(canCreate, "Create a sales order to get started.")}
                />
              </TableCell>
            </TableRow>
          ) : (
            rows.map((salesOrder) => {
              const number = salesOrderDisplayNumber(salesOrder);
              const currencyCode = currencyCodeById.get(salesOrder.currency_id) ?? "";
              return (
                <TableRow key={salesOrder.id}>
                  <TableCell className="font-mono text-sm">
                    <RecordLink href={`/sales-orders/${salesOrder.id}`}>{number ?? "—"}</RecordLink>
                  </TableCell>
                  <TableCell className="font-medium">
                    <RecordLink href={`/sales-orders/${salesOrder.id}`}>
                      {customerNameById.get(salesOrder.customer_id) ?? "—"}
                    </RecordLink>
                  </TableCell>
                  <TableCell>{formatDate(salesOrder.order_date)}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap items-center gap-1">
                      <DocumentStatusBadge
                        status={salesOrder.status}
                        labels={SALES_ORDER_STATUS_LABELS}
                        variants={SALES_ORDER_STATUS_VARIANTS}
                      />
                      <DocumentStatusBadge
                        status={salesOrder.fulfillment_status}
                        labels={FULFILLMENT_STATUS_LABELS}
                        variants={FULFILLMENT_STATUS_VARIANTS}
                      />
                      <DocumentStatusBadge
                        status={salesOrder.billing_status}
                        labels={BILLING_STATUS_LABELS}
                        variants={BILLING_STATUS_VARIANTS}
                      />
                    </div>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatMoney(salesOrder.grand_total, currencyCode)}
                  </TableCell>
                  {showActions ? (
                    <TableCell>
                      <DataTableRowActions
                        entityName={number ?? "sales order"}
                        viewHref={canRead ? `/sales-orders/${salesOrder.id}` : undefined}
                        editHref={
                          canUpdate && salesOrder.status === "DRAFT"
                            ? `/sales-orders/${salesOrder.id}/edit`
                            : undefined
                        }
                        extra={
                          salesOrder.available_actions.includes("clone") && canCreate ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="size-7"
                              aria-label="Clone sales order"
                              disabled={cloneSalesOrder.isPending}
                              onClick={() => void onClone(salesOrder.id)}
                            >
                              <Copy className="size-3.5" />
                            </Button>
                          ) : undefined
                        }
                        onDelete={
                          salesOrder.available_actions.includes("delete") && canDelete
                            ? () => setDeleting(salesOrder)
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
        title={`${getDocumentAction(SALES_ORDER_ACTION_REGISTRY, "delete").label} sales order ${deleting ? (salesOrderDisplayNumber(deleting) ?? "sales order") : "sales order"}`}
        description={
          deleting
            ? (getDocumentAction(SALES_ORDER_ACTION_REGISTRY, "delete").confirmCopy?.(
                salesOrderDisplayNumber(deleting) ?? "sales order",
              ) ?? "")
            : ""
        }
        confirmLabel={getDocumentAction(SALES_ORDER_ACTION_REGISTRY, "delete").label}
        pending={deleteSalesOrder.isPending}
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
