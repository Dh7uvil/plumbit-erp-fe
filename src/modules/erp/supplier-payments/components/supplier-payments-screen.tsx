"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { useAllSuppliers } from "@/modules/erp/suppliers/queries";
import { useAllCurrencies } from "@/modules/erp/currencies/queries";
import { supplierPaymentColumnDefs } from "@/modules/erp/supplier-payments/components/supplier-payment-columns";
import { useDeleteSupplierPayment } from "@/modules/erp/supplier-payments/mutations";
import { supplierPaymentPermissions } from "@/modules/erp/supplier-payments/permissions";
import { useSupplierPayments } from "@/modules/erp/supplier-payments/queries";
import {
  INVOICE_DOCUMENT_STATUS_LABELS,
  INVOICE_DOCUMENT_STATUSES,
  PAYMENT_METHOD_LABELS,
  PAYMENT_METHODS,
  supplierPaymentDisplayNumber,
  type SupplierPayment,
  type InvoiceDocumentStatus,
  type PaymentMethod,
} from "@/modules/erp/supplier-payments/schemas";
import { SUPPLIER_PAYMENT_ACTION_REGISTRY } from "@/modules/erp/supplier-payments/workflow";
import { getErrorMessage } from "@/shared/api/errors";
import { emptyListMessage, useCrudPermissions } from "@/shared/auth/use-crud-permissions";
import { DataTableColumnHeads, DataTableCells } from "@/shared/components/data-table/column-cells";
import { useUserNameMap } from "@/shared/components/data-table/audit-columns";
import { DataTable } from "@/shared/components/data-table/data-table";
import { DateRangeFilter } from "@/shared/components/data-table/date-range-filter";
import { FilterSelect } from "@/shared/components/data-table/filter-select";
import { ListSearch } from "@/shared/components/data-table/list-search";
import { FilterField, MoreFiltersDialog } from "@/shared/components/data-table/more-filters-dialog";
import { DataTablePagination } from "@/shared/components/data-table/pagination";
import { DataTableRowActions, hasRowActions } from "@/shared/components/data-table/row-actions";
import { SortDialog } from "@/shared/components/data-table/sort-dialog";
import { DataTableEmpty, DataTableError } from "@/shared/components/data-table/states";
import { getDocumentAction } from "@/shared/components/document/workflow-registry";
import { ConfirmActionDialog } from "@/shared/components/feedback/confirm-action-dialog";
import { DataTableToolbar } from "@/shared/components/data-table/toolbar";
import { useTableColumns } from "@/shared/components/data-table/use-table-columns";
import { ListPage } from "@/shared/components/layout/list-page";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Button } from "@/shared/components/ui/button";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { TableBody, TableCell, TableHeader, TableRow } from "@/shared/components/ui/table";
import { useTableParams } from "@/shared/hooks/use-table-params";

const ALL = "all";
const SORT_FIELDS = [
  { value: "document_number", label: "Number" },
  { value: "payment_date", label: "Date" },
  { value: "status", label: "Status" },
  { value: "amount_paid", label: "Amount" },
] as const;

function parseStatus(value: string | undefined): InvoiceDocumentStatus | undefined {
  return INVOICE_DOCUMENT_STATUSES.includes(value as InvoiceDocumentStatus)
    ? (value as InvoiceDocumentStatus)
    : undefined;
}

function parseMethod(value: string | undefined): PaymentMethod | undefined {
  return PAYMENT_METHODS.includes(value as PaymentMethod) ? (value as PaymentMethod) : undefined;
}

export function SupplierPaymentsScreen() {
  const { canCreate, canRead, canUpdate, canDelete } = useCrudPermissions(supplierPaymentPermissions);
  const { page, page_size, search, sort_by, sort_order, filters, setParams, setPage } =
    useTableParams();
  const extraFilters = {
    currencyId: filters.currency_id ?? ALL,
    method: filters.payment_method ?? ALL,
    dateFrom: filters.payment_date_from ?? "",
    dateTo: filters.payment_date_to ?? "",
  };
  const extraCount = [
    extraFilters.currencyId !== ALL,
    extraFilters.method !== ALL,
    Boolean(extraFilters.dateFrom),
    Boolean(extraFilters.dateTo),
  ].filter(Boolean).length;
  const [draftExtra, setDraftExtra] = useState(extraFilters);
  const paymentsQuery = useSupplierPayments({
    page,
    page_size,
    search,
    sort_by,
    sort_order,
    status: parseStatus(filters.status),
    supplier_id: filters.supplier_id,
    currency_id: filters.currency_id,
    payment_method: parseMethod(filters.payment_method),
    payment_date_from: filters.payment_date_from,
    payment_date_to: filters.payment_date_to,
  });
  const suppliersQuery = useAllSuppliers();
  const currenciesQuery = useAllCurrencies();
  const deletePayment = useDeleteSupplierPayment();
  const [deleting, setDeleting] = useState<SupplierPayment | null>(null);
  const deleteSpec = getDocumentAction(SUPPLIER_PAYMENT_ACTION_REGISTRY, "delete");

  const rows = paymentsQuery.data?.data ?? [];
  const meta = paymentsQuery.data?.meta;
  const suppliers = suppliersQuery.data ?? [];
  const currencies = currenciesQuery.data ?? [];
  const supplierNameById = useMemo(
    () => new Map(suppliers.map((supplier) => [supplier.id, supplier.name])),
    [suppliers],
  );
  const currencyCodeById = useMemo(
    () => new Map(currencies.map((currency) => [currency.id, currency.code])),
    [currencies],
  );
  const userNameById = useUserNameMap();
  const showActions = hasRowActions(canRead, canUpdate, canCreate, canDelete);

  async function onDelete() {
    if (!deleting) {
      return;
    }
    try {
      await deletePayment.mutateAsync({ id: deleting.id, version: deleting.version });
      toast.success("Payment deleted");
      setDeleting(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  const columnDefs = useMemo(
    () =>
      supplierPaymentColumnDefs({
        supplierNameById,
        currencyCodeById,
        userNameById,
        actions: showActions
          ? (payment) => {
              const number = supplierPaymentDisplayNumber(payment);
              return (
                <DataTableRowActions
                  entityName={number}
                  viewHref={canRead ? `/supplier-payments/${payment.id}` : undefined}
                  editHref={
                    canUpdate && payment.status === "DRAFT"
                      ? `/supplier-payments/${payment.id}/edit`
                      : undefined
                  }
                  onDelete={
                    payment.available_actions.includes("delete") && canDelete
                      ? () => setDeleting(payment)
                      : undefined
                  }
                />
              );
            }
          : undefined,
      }),
    [canDelete, canRead, canUpdate, currencyCodeById, setDeleting, showActions, supplierNameById, userNameById],
  );

  const { columns, columnsDialog, colSpan } = useTableColumns("erp.supplier_payments", columnDefs);

  return (
    <ListPage>
      <PageHeader
        title="Supplier payments"
        subtitle="Bank payments against bills and advances. Leftover amount stays as a supplier advance."
        actions={
          canCreate ? (
            <Button type="button" size="sm" asChild>
              <Link href="/supplier-payments/new">
                <Plus className="size-3.5" />
                New payment
              </Link>
            </Button>
          ) : undefined
        }
      />
      <DataTableToolbar>
        <ListSearch
          value={search ?? ""}
          onChange={(value) => setParams({ search: value || null })}
          placeholder="Search number, supplier, reference…"
        />
        <FilterSelect
          label="Status"
          className="w-44"
          placeholder="Status"
          value={filters.status ?? ALL}
          onValueChange={(value) =>
            setParams({ filters: { status: value === ALL ? null : value } })
          }
          options={[
            { value: ALL, label: "All statuses" },
            ...INVOICE_DOCUMENT_STATUSES.map((status) => ({
              value: status,
              label: INVOICE_DOCUMENT_STATUS_LABELS[status],
            })),
          ]}
        />
        <FilterSelect
          label="Supplier"
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
              draftExtra.currencyId !== ALL,
              draftExtra.method !== ALL,
              Boolean(draftExtra.dateFrom),
              Boolean(draftExtra.dateTo),
            ].filter(Boolean).length
          }
          description="Filter by method, currency, and payment date."
          onOpen={() => setDraftExtra(extraFilters)}
          onApply={() =>
            setParams({
              filters: {
                currency_id: draftExtra.currencyId === ALL ? null : draftExtra.currencyId,
                payment_method: draftExtra.method === ALL ? null : draftExtra.method,
                payment_date_from: draftExtra.dateFrom || null,
                payment_date_to: draftExtra.dateTo || null,
              },
            })
          }
          onClearDraft={() =>
            setDraftExtra({ currencyId: ALL, method: ALL, dateFrom: "", dateTo: "" })
          }
        >
          <FilterField label="Method" htmlFor="pay-filter-method">
            <FilterSelect
              id="pay-filter-method"
              className="w-full"
              placeholder="Method"
              value={draftExtra.method}
              onValueChange={(value) => setDraftExtra((current) => ({ ...current, method: value }))}
              options={[
                { value: ALL, label: "All methods" },
                ...PAYMENT_METHODS.map((method) => ({
                  value: method,
                  label: PAYMENT_METHOD_LABELS[method],
                })),
              ]}
            />
          </FilterField>
          <FilterField label="Currency" htmlFor="pay-filter-currency">
            <FilterSelect
              id="pay-filter-currency"
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
          <DateRangeFilter
            fromId="pay-date-from"
            toId="pay-date-to"
            fromLabel="From"
            toLabel="To"
            from={draftExtra.dateFrom}
            to={draftExtra.dateTo}
            onFromChange={(value) => setDraftExtra((current) => ({ ...current, dateFrom: value }))}
            onToChange={(value) => setDraftExtra((current) => ({ ...current, dateTo: value }))}
          />
        </MoreFiltersDialog>
        <SortDialog
          fields={[...SORT_FIELDS]}
          sortBy={sort_by}
          sortOrder={sort_order}
          onApply={setParams}
        />
        {columnsDialog}
        {search ||
        filters.status ||
        filters.supplier_id ||
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
                  currency_id: null,
                  payment_method: null,
                  payment_date_from: null,
                  payment_date_to: null,
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
          {paymentsQuery.isLoading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell colSpan={colSpan}>
                  <Skeleton className="h-6 w-full" />
                </TableCell>
              </TableRow>
            ))
          ) : paymentsQuery.isError ? (
            <TableRow>
              <TableCell colSpan={colSpan}>
                <DataTableError
                  message={getErrorMessage(paymentsQuery.error)}
                  onRetry={() => paymentsQuery.refetch()}
                />
              </TableCell>
            </TableRow>
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={colSpan}>
                <DataTableEmpty
                  title="No payments"
                  message={emptyListMessage(canCreate, "Record a supplier payment to get started.")}
                />
              </TableCell>
            </TableRow>
          ) : (
            rows.map((payment) => (
              <TableRow key={payment.id}>
                <DataTableCells columns={columns} row={payment} />
              </TableRow>
            ))
          )}
        </TableBody>
      </DataTable>
      <ConfirmActionDialog
        open={Boolean(deleting)}
        title={`${deleteSpec.label} payment ${deleting ? (supplierPaymentDisplayNumber(deleting) ?? "payment") : "receipt"}`}
        description={
          deleting
            ? (deleteSpec.confirmCopy?.(supplierPaymentDisplayNumber(deleting) ?? "payment") ?? "")
            : ""
        }
        confirmLabel={deleteSpec.label}
        pending={deletePayment.isPending}
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
