"use client";

import { useMemo, type ReactNode } from "react";

import { useAllCurrencies } from "@/modules/erp/currencies/queries";
import { customerPaymentColumnDefs } from "@/modules/erp/customer-payments/components/customer-payment-columns";
import { customerPaymentPermissions } from "@/modules/erp/customer-payments/permissions";
import { useCustomerPayments } from "@/modules/erp/customer-payments/queries";
import {
  INVOICE_DOCUMENT_STATUS_LABELS,
  INVOICE_DOCUMENT_STATUSES,
  PAYMENT_METHOD_LABELS,
  PAYMENT_METHODS,
  customerPaymentDisplayNumber,
  type InvoiceDocumentStatus,
  type PaymentMethod,
} from "@/modules/erp/customer-payments/schemas";
import { supplierPaymentColumnDefs } from "@/modules/erp/supplier-payments/components/supplier-payment-columns";
import { supplierPaymentPermissions } from "@/modules/erp/supplier-payments/permissions";
import { useSupplierPayments } from "@/modules/erp/supplier-payments/queries";
import { supplierPaymentDisplayNumber } from "@/modules/erp/supplier-payments/schemas";
import { getErrorMessage } from "@/shared/api/errors";
import { emptyListMessage, useCrudPermissions } from "@/shared/auth/use-crud-permissions";
import { useUserNameMap } from "@/shared/components/data-table/audit-columns";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { TableBody, TableCell, TableHeader, TableRow } from "@/shared/components/ui/table";
import { useNestedTableParams } from "@/shared/hooks/use-table-params";

const ALL = "all";
const CUSTOMER_SORT_FIELDS = [
  { value: "document_number", label: "Number" },
  { value: "payment_date", label: "Date" },
  { value: "status", label: "Status" },
  { value: "amount_received", label: "Amount" },
] as const;
const SUPPLIER_SORT_FIELDS = [
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

const STATUS_OPTIONS = [
  { value: ALL, label: "All statuses" },
  ...INVOICE_DOCUMENT_STATUSES.map((status) => ({
    value: status,
    label: INVOICE_DOCUMENT_STATUS_LABELS[status],
  })),
];
const METHOD_OPTIONS = [
  { value: ALL, label: "All methods" },
  ...PAYMENT_METHODS.map((method) => ({
    value: method,
    label: PAYMENT_METHOD_LABELS[method],
  })),
];

export function PartyPaymentHistoryCard({
  kind,
  partyId,
  title = "Payment history",
}: {
  kind: "customer" | "supplier";
  partyId: string;
  title?: string;
}) {
  if (kind === "customer") {
    return <CustomerPaymentHistoryTable partyId={partyId} title={title} />;
  }
  return <SupplierPaymentHistoryTable partyId={partyId} title={title} />;
}

function CustomerPaymentHistoryTable({ partyId, title }: { partyId: string; title: string }) {
  const { canRead, canUpdate, canDelete } = useCrudPermissions(customerPaymentPermissions);
  const { page, page_size, search, sort_by, sort_order, filters, setParams, setPage, setPageSize } =
    useNestedTableParams();
  const paymentsQuery = useCustomerPayments(
    {
      page,
      page_size,
      search,
      sort_by,
      sort_order,
      customer_id: partyId,
      status: parseStatus(filters.status),
      payment_method: parseMethod(filters.payment_method),
      payment_date_from: filters.payment_date_from,
      payment_date_to: filters.payment_date_to,
    },
    canRead,
  );
  const currenciesQuery = useAllCurrencies();
  const currencyCodeById = useMemo(
    () => new Map((currenciesQuery.data ?? []).map((currency) => [currency.id, currency.code])),
    [currenciesQuery.data],
  );
  const userNameById = useUserNameMap();
  const showActions = hasRowActions(canRead, canUpdate, canDelete);
  const rows = paymentsQuery.data?.data ?? [];
  const meta = paymentsQuery.data?.meta;
  const columnDefs = useMemo(
    () =>
      customerPaymentColumnDefs({
        currencyCodeById,
        userNameById,
        omit: ["customer"],
        actions: showActions
          ? (payment) => (
              <DataTableRowActions
                entityName={customerPaymentDisplayNumber(payment)}
                viewHref={canRead ? `/customer-payments/${payment.id}` : undefined}
                editHref={
                  canUpdate && payment.status === "DRAFT"
                    ? `/customer-payments/${payment.id}/edit`
                    : undefined
                }
              />
            )
          : undefined,
      }),
    [canRead, canUpdate, currencyCodeById, showActions, userNameById],
  );
  const { columns, columnsDialog, colSpan } = useTableColumns("erp.customer_payments", columnDefs);
  const hasQuery = Boolean(
    search ||
    filters.status ||
    filters.payment_method ||
    filters.payment_date_from ||
    filters.payment_date_to ||
    sort_by,
  );

  if (!canRead) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <PaymentHistoryToolbar
          search={search ?? ""}
          filters={filters}
          sortBy={sort_by}
          sortOrder={sort_order}
          sortFields={CUSTOMER_SORT_FIELDS}
          hasQuery={hasQuery}
          columnsDialog={columnsDialog}
          onSearch={(value) => setParams({ search: value || null })}
          onFilter={(key, value) => setParams({ filters: { [key]: value } })}
          onSort={setParams}
          onClear={() =>
            setParams({
              search: null,
              sort_by: null,
              sort_order: null,
              filters: {
                status: null,
                payment_method: null,
                payment_date_from: null,
                payment_date_to: null,
              },
            })
          }
        />
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
            {paymentsQuery.isLoading ? (
              Array.from({ length: 3 }).map((_, index) => (
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
                    message={emptyListMessage(false, "No posted payments yet.")}
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
      </CardContent>
    </Card>
  );
}

function SupplierPaymentHistoryTable({ partyId, title }: { partyId: string; title: string }) {
  const { canRead, canUpdate, canDelete } = useCrudPermissions(supplierPaymentPermissions);
  const { page, page_size, search, sort_by, sort_order, filters, setParams, setPage, setPageSize } =
    useNestedTableParams();
  const paymentsQuery = useSupplierPayments(
    {
      page,
      page_size,
      search,
      sort_by,
      sort_order,
      supplier_id: partyId,
      status: parseStatus(filters.status),
      payment_method: parseMethod(filters.payment_method),
      payment_date_from: filters.payment_date_from,
      payment_date_to: filters.payment_date_to,
    },
    canRead,
  );
  const currenciesQuery = useAllCurrencies();
  const currencyCodeById = useMemo(
    () => new Map((currenciesQuery.data ?? []).map((currency) => [currency.id, currency.code])),
    [currenciesQuery.data],
  );
  const userNameById = useUserNameMap();
  const showActions = hasRowActions(canRead, canUpdate, canDelete);
  const rows = paymentsQuery.data?.data ?? [];
  const meta = paymentsQuery.data?.meta;
  const columnDefs = useMemo(
    () =>
      supplierPaymentColumnDefs({
        currencyCodeById,
        userNameById,
        omit: ["supplier"],
        actions: showActions
          ? (payment) => (
              <DataTableRowActions
                entityName={supplierPaymentDisplayNumber(payment)}
                viewHref={canRead ? `/supplier-payments/${payment.id}` : undefined}
                editHref={
                  canUpdate && payment.status === "DRAFT"
                    ? `/supplier-payments/${payment.id}/edit`
                    : undefined
                }
              />
            )
          : undefined,
      }),
    [canRead, canUpdate, currencyCodeById, showActions, userNameById],
  );
  const { columns, columnsDialog, colSpan } = useTableColumns("erp.supplier_payments", columnDefs);
  const hasQuery = Boolean(
    search ||
    filters.status ||
    filters.payment_method ||
    filters.payment_date_from ||
    filters.payment_date_to ||
    sort_by,
  );

  if (!canRead) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <PaymentHistoryToolbar
          search={search ?? ""}
          filters={filters}
          sortBy={sort_by}
          sortOrder={sort_order}
          sortFields={SUPPLIER_SORT_FIELDS}
          hasQuery={hasQuery}
          columnsDialog={columnsDialog}
          onSearch={(value) => setParams({ search: value || null })}
          onFilter={(key, value) => setParams({ filters: { [key]: value } })}
          onSort={setParams}
          onClear={() =>
            setParams({
              search: null,
              sort_by: null,
              sort_order: null,
              filters: {
                status: null,
                payment_method: null,
                payment_date_from: null,
                payment_date_to: null,
              },
            })
          }
        />
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
            {paymentsQuery.isLoading ? (
              Array.from({ length: 3 }).map((_, index) => (
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
                    message={emptyListMessage(false, "No posted payments yet.")}
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
      </CardContent>
    </Card>
  );
}

function PaymentHistoryToolbar({
  search,
  filters,
  sortBy,
  sortOrder,
  sortFields,
  hasQuery,
  columnsDialog,
  onSearch,
  onFilter,
  onSort,
  onClear,
}: {
  search: string;
  filters: Record<string, string>;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  sortFields: readonly { value: string; label: string }[];
  hasQuery: boolean;
  columnsDialog: ReactNode;
  onSearch: (value: string) => void;
  onFilter: (key: string, value: string | null) => void;
  onSort: (next: { sort_by?: string | null; sort_order?: "asc" | "desc" | null }) => void;
  onClear: () => void;
}) {
  return (
    <DataTableToolbar>
      <ListSearch value={search} onChange={onSearch} placeholder="Search number or reference…" />
      <FilterSelect
        label="Status"
        className="w-36"
        placeholder="Status"
        value={filters.status ?? ALL}
        onValueChange={(value) => onFilter("status", value === ALL ? null : value)}
        options={STATUS_OPTIONS}
      />
      <FilterSelect
        label="Method"
        className="w-36"
        placeholder="Method"
        value={filters.payment_method ?? ALL}
        onValueChange={(value) => onFilter("payment_method", value === ALL ? null : value)}
        options={METHOD_OPTIONS}
      />
      <DateRangeFilter
        layout="inline"
        from={filters.payment_date_from ?? ""}
        to={filters.payment_date_to ?? ""}
        onFromChange={(value) => onFilter("payment_date_from", value || null)}
        onToChange={(value) => onFilter("payment_date_to", value || null)}
      />
      <SortDialog fields={[...sortFields]} sortBy={sortBy} sortOrder={sortOrder} onApply={onSort} />
      {columnsDialog}
      {hasQuery ? (
        <Button type="button" variant="ghost" size="sm" onClick={onClear}>
          Clear
        </Button>
      ) : null}
    </DataTableToolbar>
  );
}
