"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { useAllCustomers } from "@/modules/crm/customers/queries";
import { useAllCurrencies } from "@/modules/erp/currencies/queries";
import { voucherColumnDefs } from "@/modules/erp/accounting/vouchers/components/voucher-columns";
import { useDeleteVoucher } from "@/modules/erp/accounting/vouchers/mutations";
import { voucherPermissions } from "@/modules/erp/accounting/vouchers/permissions";
import { useVouchers } from "@/modules/erp/accounting/vouchers/queries";
import {
  INVOICE_DOCUMENT_STATUS_LABELS,
  INVOICE_DOCUMENT_STATUSES,
  PAYMENT_METHOD_LABELS,
  PAYMENT_METHODS,
  voucherDisplayNumber,
  type InvoiceDocumentStatus,
  type PaymentMethod,
  type Voucher,
  type VoucherEntryType,
} from "@/modules/erp/accounting/vouchers/schemas";
import { VOUCHER_ACTION_REGISTRY } from "@/modules/erp/accounting/vouchers/workflow";
import { useAllSuppliers } from "@/modules/erp/suppliers/queries";
import { getErrorMessage } from "@/shared/api/errors";
import { emptyListMessage, useCrudPermissions } from "@/shared/auth/use-crud-permissions";
import { DataTableColumnHeads, DataTableCells } from "@/shared/components/data-table/column-cells";
import { DataTable } from "@/shared/components/data-table/data-table";
import { DateRangeFilter } from "@/shared/components/data-table/date-range-filter";
import { FilterSelect } from "@/shared/components/data-table/filter-select";
import { ListSearch } from "@/shared/components/data-table/list-search";
import { FilterField, MoreFiltersDialog } from "@/shared/components/data-table/more-filters-dialog";
import { DataTablePagination } from "@/shared/components/data-table/pagination";
import { DataTableRowActions, hasRowActions } from "@/shared/components/data-table/row-actions";
import { SortDialog } from "@/shared/components/data-table/sort-dialog";
import { DataTableEmpty, DataTableError } from "@/shared/components/data-table/states";
import { DataTableToolbar } from "@/shared/components/data-table/toolbar";
import { useTableColumns } from "@/shared/components/data-table/use-table-columns";
import { getDocumentAction } from "@/shared/components/document/workflow-registry";
import { ConfirmActionDialog } from "@/shared/components/feedback/confirm-action-dialog";
import { Button } from "@/shared/components/ui/button";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { TableBody, TableCell, TableHeader, TableRow } from "@/shared/components/ui/table";
import { useTableParams } from "@/shared/hooks/use-table-params";

const ALL = "all";
const SORT_FIELDS = [
  { value: "document_number", label: "Number" },
  { value: "voucher_date", label: "Date" },
  { value: "status", label: "Status" },
  { value: "total_amount", label: "Amount" },
] as const;

function parseStatus(value: string | undefined): InvoiceDocumentStatus | undefined {
  return INVOICE_DOCUMENT_STATUSES.includes(value as InvoiceDocumentStatus)
    ? (value as InvoiceDocumentStatus)
    : undefined;
}

function parseMethod(value: string | undefined): PaymentMethod | undefined {
  return PAYMENT_METHODS.includes(value as PaymentMethod) ? (value as PaymentMethod) : undefined;
}

function isReceiptVoucherType(voucherType: VoucherEntryType | undefined): boolean {
  return voucherType === "CASH_RECEIPT" || voucherType === "BANK_RECEIPT";
}

function isPaymentVoucherType(voucherType: VoucherEntryType | undefined): boolean {
  return voucherType === "CASH_PAYMENT" || voucherType === "BANK_PAYMENT";
}

export function VouchersScreen({
  embedded = false,
  voucherType,
}: {
  embedded?: boolean;
  voucherType?: VoucherEntryType;
}) {
  const { canCreate, canRead, canUpdate, canDelete } = useCrudPermissions(voucherPermissions);
  const { page, page_size, search, sort_by, sort_order, filters, setParams, setPage } =
    useTableParams();
  const extraFilters = {
    currencyId: filters.currency_id ?? ALL,
    method: filters.payment_method ?? ALL,
    dateFrom: filters.voucher_date_from ?? "",
    dateTo: filters.voucher_date_to ?? "",
  };
  const extraCount = [
    extraFilters.currencyId !== ALL,
    extraFilters.method !== ALL,
    Boolean(extraFilters.dateFrom),
    Boolean(extraFilters.dateTo),
  ].filter(Boolean).length;
  const [draftExtra, setDraftExtra] = useState(extraFilters);
  const [deleting, setDeleting] = useState<Voucher | null>(null);
  const deleteVoucher = useDeleteVoucher();
  const deleteSpec = getDocumentAction(VOUCHER_ACTION_REGISTRY, "delete");
  const showCustomerFilter = isReceiptVoucherType(voucherType);
  const showSupplierFilter = isPaymentVoucherType(voucherType);
  const query = useVouchers({
    page,
    page_size,
    search,
    sort_by,
    sort_order,
    voucher_type: voucherType,
    status: parseStatus(filters.status),
    party_id: filters.party_id,
    currency_id: filters.currency_id,
    payment_method: parseMethod(filters.payment_method),
    voucher_date_from: filters.voucher_date_from,
    voucher_date_to: filters.voucher_date_to,
  });
  const customersQuery = useAllCustomers(showCustomerFilter);
  const suppliersQuery = useAllSuppliers(showSupplierFilter);
  const currenciesQuery = useAllCurrencies();

  const customers = customersQuery.data ?? [];
  const suppliers = suppliersQuery.data ?? [];
  const currencies = currenciesQuery.data ?? [];
  const customerNameById = useMemo(
    () => new Map(customers.map((customer) => [customer.id, customer.name])),
    [customers],
  );
  const supplierNameById = useMemo(
    () => new Map(suppliers.map((supplier) => [supplier.id, supplier.name])),
    [suppliers],
  );
  const partyNameById = useMemo(() => {
    if (showCustomerFilter) {
      return customerNameById;
    }
    if (showSupplierFilter) {
      return supplierNameById;
    }
    return new Map([...customerNameById, ...supplierNameById]);
  }, [customerNameById, showCustomerFilter, showSupplierFilter, supplierNameById]);
  const currencyCodeById = useMemo(
    () => new Map(currencies.map((currency) => [currency.id, currency.code])),
    [currencies],
  );
  const showActions = hasRowActions(canRead, canUpdate, canCreate, canDelete);

  const columnDefs = useMemo(
    () =>
      voucherColumnDefs({
        currencyCodeById,
        partyNameById,
        showType: !voucherType,
        actions: showActions
          ? (row) => {
              const number = voucherDisplayNumber(row);
              return (
                <DataTableRowActions
                  entityName={number}
                  viewHref={canRead ? `/vouchers/${row.id}` : undefined}
                  editHref={
                    canUpdate && row.status === "DRAFT" ? `/vouchers/${row.id}/edit` : undefined
                  }
                  onDelete={
                    row.available_actions.includes("delete") && canDelete
                      ? () => setDeleting(row)
                      : undefined
                  }
                />
              );
            }
          : undefined,
      }),
    [canDelete, canRead, canUpdate, currencyCodeById, partyNameById, showActions, voucherType],
  );

  const { columns, columnsDialog, colSpan } = useTableColumns("erp.vouchers", columnDefs);

  if (!canRead) {
    return <DataTableEmpty message="You do not have permission to view vouchers." />;
  }

  const rows = query.data?.data ?? [];
  const meta = query.data?.meta;
  const newHref = voucherType ? `/vouchers/new?voucher_type=${voucherType}` : "/vouchers/new";
  const hasActiveFilters =
    Boolean(search) ||
    Boolean(filters.status) ||
    Boolean(filters.party_id) ||
    extraCount > 0 ||
    Boolean(sort_by);

  async function onDelete() {
    if (!deleting) {
      return;
    }
    try {
      await deleteVoucher.mutateAsync({ id: deleting.id, version: deleting.version });
      toast.success("Voucher deleted");
      setDeleting(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {!embedded ? (
        <DataTableToolbar>
          {canCreate ? (
            <Button type="button" size="sm" asChild>
              <Link href={newHref}>
                <Plus className="size-3.5" />
                New voucher
              </Link>
            </Button>
          ) : null}
        </DataTableToolbar>
      ) : null}
      <DataTableToolbar>
        <ListSearch
          value={search ?? ""}
          onChange={(value) => setParams({ search: value || null, page: 1 })}
          placeholder="Search number, party, reference…"
        />
        <FilterSelect
          label="Status"
          className="w-44"
          placeholder="Status"
          value={filters.status ?? ALL}
          onValueChange={(value) =>
            setParams({ filters: { status: value === ALL ? null : value }, page: 1 })
          }
          options={[
            { value: ALL, label: "All statuses" },
            ...INVOICE_DOCUMENT_STATUSES.map((status) => ({
              value: status,
              label: INVOICE_DOCUMENT_STATUS_LABELS[status],
            })),
          ]}
        />
        {showCustomerFilter ? (
          <FilterSelect
            label="Customer"
            className="w-48"
            placeholder="Customer"
            value={filters.party_id ?? ALL}
            onValueChange={(value) =>
              setParams({ filters: { party_id: value === ALL ? null : value }, page: 1 })
            }
            options={[
              { value: ALL, label: "All customers" },
              ...customers.map((customer) => ({ value: customer.id, label: customer.name })),
            ]}
          />
        ) : null}
        {showSupplierFilter ? (
          <FilterSelect
            label="Supplier"
            className="w-48"
            placeholder="Supplier"
            value={filters.party_id ?? ALL}
            onValueChange={(value) =>
              setParams({ filters: { party_id: value === ALL ? null : value }, page: 1 })
            }
            options={[
              { value: ALL, label: "All suppliers" },
              ...suppliers.map((supplier) => ({ value: supplier.id, label: supplier.name })),
            ]}
          />
        ) : null}
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
          description="Filter by method, currency, and voucher date."
          onOpen={() => setDraftExtra(extraFilters)}
          onApply={() =>
            setParams({
              page: 1,
              filters: {
                currency_id: draftExtra.currencyId === ALL ? null : draftExtra.currencyId,
                payment_method: draftExtra.method === ALL ? null : draftExtra.method,
                voucher_date_from: draftExtra.dateFrom || null,
                voucher_date_to: draftExtra.dateTo || null,
              },
            })
          }
          onClearDraft={() =>
            setDraftExtra({ currencyId: ALL, method: ALL, dateFrom: "", dateTo: "" })
          }
        >
          <FilterField label="Method" htmlFor="voucher-filter-method">
            <FilterSelect
              id="voucher-filter-method"
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
          <FilterField label="Currency" htmlFor="voucher-filter-currency">
            <FilterSelect
              id="voucher-filter-currency"
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
            fromId="voucher-date-from"
            toId="voucher-date-to"
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
          onApply={(patch) => setParams({ ...patch, page: 1 })}
        />
        {columnsDialog}
        {hasActiveFilters ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() =>
              setParams({
                search: null,
                sort_by: null,
                sort_order: null,
                page: 1,
                filters: {
                  status: null,
                  party_id: null,
                  currency_id: null,
                  payment_method: null,
                  voucher_date_from: null,
                  voucher_date_to: null,
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
              onSort={(patch) => setParams({ ...patch, page: 1 })}
            />
          </TableRow>
        </TableHeader>
        <TableBody>
          {query.isLoading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell colSpan={colSpan}>
                  <Skeleton className="h-6 w-full" />
                </TableCell>
              </TableRow>
            ))
          ) : query.isError ? (
            <TableRow>
              <TableCell colSpan={colSpan}>
                <DataTableError
                  message={getErrorMessage(query.error)}
                  onRetry={() => query.refetch()}
                />
              </TableCell>
            </TableRow>
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={colSpan}>
                <DataTableEmpty
                  title="No vouchers"
                  message={emptyListMessage(canCreate, "Create a voucher to get started.")}
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
      <ConfirmActionDialog
        open={Boolean(deleting)}
        title={`${deleteSpec.label} voucher ${deleting ? voucherDisplayNumber(deleting) : "voucher"}`}
        description={
          deleting ? (deleteSpec.confirmCopy?.(voucherDisplayNumber(deleting)) ?? "") : ""
        }
        confirmLabel={deleteSpec.label}
        pending={deleteVoucher.isPending}
        onOpenChange={(open) => !open && setDeleting(null)}
        onConfirm={() => void onDelete()}
      />
    </div>
  );
}
