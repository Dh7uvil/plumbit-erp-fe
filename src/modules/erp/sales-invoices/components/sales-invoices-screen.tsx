"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { useAllCustomers } from "@/modules/crm/customers/queries";
import { useAllCurrencies } from "@/modules/erp/currencies/queries";
import { reportPermissions } from "@/modules/erp/accounting/reports/permissions";
import { useExportEvidenceExceptions } from "@/modules/erp/accounting/reports/queries";
import { CreateSalesInvoiceFromProformaDialog } from "@/modules/erp/proforma-invoices/components/create-sales-invoice-dialog";
import { proformaInvoicePermissions } from "@/modules/erp/proforma-invoices/permissions";
import { CreateSalesInvoiceFromQuotationDialog } from "@/modules/erp/quotations/components/create-sales-invoice-dialog";
import { quotationPermissions } from "@/modules/erp/quotations/permissions";
import { salesOrderPermissions } from "@/modules/erp/sales-orders/permissions";
import { CreateInvoiceFromDeliveryNotesDialog } from "@/modules/erp/sales-invoices/components/create-from-delivery-notes-dialog";
import { CreateInvoiceFromSalesOrderDialog } from "@/modules/erp/sales-invoices/components/create-from-sales-order-dialog";
import { useDeleteSalesInvoice } from "@/modules/erp/sales-invoices/mutations";
import { salesInvoicePermissions } from "@/modules/erp/sales-invoices/permissions";
import { useSalesInvoices } from "@/modules/erp/sales-invoices/queries";
import {
  INVOICE_DOCUMENT_STATUS_LABELS,
  INVOICE_DOCUMENT_STATUS_VARIANTS,
  INVOICE_DOCUMENT_STATUSES,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_VARIANTS,
  PAYMENT_STATUSES,
  isSalesInvoiceOverdue,
  salesInvoiceDisplayNumber,
  type InvoiceDocumentStatus,
  type PaymentStatus,
  type SalesInvoice,
} from "@/modules/erp/sales-invoices/schemas";
import { SALES_INVOICE_ACTION_REGISTRY } from "@/modules/erp/sales-invoices/workflow";
import { useAllBranches } from "@/modules/users-management/branches/queries";
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
import { CONVERT_FROM_MENU_CLASSNAME, CONVERT_FROM_TRIGGER_CLASSNAME } from "@/shared/components/document/convert-from-menu";
import { DocumentStatusBadge } from "@/shared/components/document/document-status-badge";
import { getDocumentAction } from "@/shared/components/document/workflow-registry";
import { ConfirmActionDialog } from "@/shared/components/feedback/confirm-action-dialog";
import { ImexToolbar } from "@/shared/components/imex/imex-toolbar";
import { DataTableToolbar } from "@/shared/components/data-table/toolbar";
import { ListPage } from "@/shared/components/layout/list-page";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Alert, AlertDescription } from "@/shared/components/ui/alert";
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
import { useCan } from "@/shared/providers/session-provider";

const COLUMN_HEADERS = ["Number", "Customer", "Date", "Due", "Status", "Payment", "Grand total"] as const;
const ALL = "all";
const SORT_FIELDS = [
  { value: "document_number", label: "Number" },
  { value: "invoice_date", label: "Date" },
  { value: "due_date", label: "Due date" },
  { value: "status", label: "Status" },
  { value: "grand_total", label: "Grand total" },
] as const;
const SORT_FIELD_BY_HEADER: Partial<Record<string, string>> = {
  Number: "document_number",
  Date: "invoice_date",
  Due: "due_date",
  Status: "status",
  "Grand total": "grand_total",
};

function todayIsoDate(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

function parseStatus(value: string | undefined): InvoiceDocumentStatus | undefined {
  return INVOICE_DOCUMENT_STATUSES.includes(value as InvoiceDocumentStatus)
    ? (value as InvoiceDocumentStatus)
    : undefined;
}

function parsePaymentStatus(value: string | undefined): PaymentStatus | undefined {
  return PAYMENT_STATUSES.includes(value as PaymentStatus) ? (value as PaymentStatus) : undefined;
}

export function SalesInvoicesScreen() {
  const { canCreate, canRead, canUpdate, canDelete } = useCrudPermissions(salesInvoicePermissions);
  const can = useCan();
  const { page, page_size, search, sort_by, sort_order, filters, setParams, setPage } =
    useTableParams();
  const extraFilters = {
    paymentStatus: filters.payment_status ?? ALL,
    branchId: filters.branch_id ?? ALL,
    currencyId: filters.currency_id ?? ALL,
    invoiceDateFrom: filters.invoice_date_from ?? "",
    invoiceDateTo: filters.invoice_date_to ?? "",
  };
  const extraCount = [
    extraFilters.paymentStatus !== ALL,
    extraFilters.branchId !== ALL,
    extraFilters.currencyId !== ALL,
    Boolean(extraFilters.invoiceDateFrom),
    Boolean(extraFilters.invoiceDateTo),
  ].filter(Boolean).length;
  const [draftExtra, setDraftExtra] = useState(extraFilters);
  const [fromQuotation, setFromQuotation] = useState(false);
  const [fromSalesOrder, setFromSalesOrder] = useState(false);
  const [fromProforma, setFromProforma] = useState(false);
  const [fromDeliveryNotes, setFromDeliveryNotes] = useState(false);
  const invoicesQuery = useSalesInvoices({
    page,
    page_size,
    search,
    sort_by,
    sort_order,
    status: parseStatus(filters.status),
    customer_id: filters.customer_id,
    payment_status: parsePaymentStatus(filters.payment_status),
    branch_id: filters.branch_id,
    currency_id: filters.currency_id,
    invoice_date_from: filters.invoice_date_from,
    invoice_date_to: filters.invoice_date_to,
  });
  const exceptionsQuery = useExportEvidenceExceptions(
    {},
    can(reportPermissions.tax),
  );
  const customersQuery = useAllCustomers();
  const currenciesQuery = useAllCurrencies();
  const branchesQuery = useAllBranches();
  const deleteInvoice = useDeleteSalesInvoice();
  const [deleting, setDeleting] = useState<SalesInvoice | null>(null);
  const today = todayIsoDate();

  const rows = invoicesQuery.data?.data ?? [];
  const meta = invoicesQuery.data?.meta;
  const customers = customersQuery.data ?? [];
  const currencies = currenciesQuery.data ?? [];
  const branches = branchesQuery.data ?? [];
  const customerNameById = new Map(customers.map((customer) => [customer.id, customer.name]));
  const currencyCodeById = new Map(currencies.map((currency) => [currency.id, currency.code]));
  const showActions = hasRowActions(canRead, canUpdate, canCreate, canDelete);
  const headers = tableHeaders(COLUMN_HEADERS, showActions);
  const exceptionCount = exceptionsQuery.data?.lines.length ?? 0;

  async function onDelete() {
    if (!deleting) {
      return;
    }
    try {
      await deleteInvoice.mutateAsync({ id: deleting.id, version: deleting.version });
      toast.success("Sales invoice deleted");
      setDeleting(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <ListPage>
      <PageHeader
        title="Sales invoices"
        subtitle="Customer invoices. Posting moves AR, not stock."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <ImexToolbar
              resource="sales-invoices"
              title="sales invoices"
              canImport={can(salesInvoicePermissions.import) || canCreate}
              canExport={can(salesInvoicePermissions.export) || canRead}
              exportParams={{ search, status: filters.status }}
              onImported={() => {
                void invoicesQuery.refetch();
              }}
            />
            {canCreate ? (
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
                  {can(quotationPermissions.read) ? (
                    <DropdownMenuItem onSelect={() => setFromQuotation(true)}>
                      Quotation
                    </DropdownMenuItem>
                  ) : null}
                  {can(salesOrderPermissions.read) ? (
                    <DropdownMenuItem onSelect={() => setFromSalesOrder(true)}>
                      Sales order
                    </DropdownMenuItem>
                  ) : null}
                  {can(proformaInvoicePermissions.read) ? (
                    <DropdownMenuItem onSelect={() => setFromProforma(true)}>
                      Proforma invoice
                    </DropdownMenuItem>
                  ) : null}
                  <DropdownMenuItem onSelect={() => setFromDeliveryNotes(true)}>
                    Delivery notes
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button type="button" size="sm" asChild>
                <Link href="/sales-invoices/new">
                  <Plus className="size-3.5" />
                  New sales invoice
                </Link>
              </Button>
            </div>
            ) : null}
          </div>
        }
      />
      {can(reportPermissions.tax) && exceptionCount > 0 ? (
        <Alert>
          <AlertDescription>
            {exceptionCount} posted export {exceptionCount === 1 ? "invoice is" : "invoices are"}{" "}
            missing BL or customs evidence.{" "}
            <Link
              href="/reports/export-evidence-exceptions"
              className="underline-offset-4 hover:underline"
            >
              Open exceptions
            </Link>
            .
          </AlertDescription>
        </Alert>
      ) : null}
      <DataTableToolbar>
        <ListSearch
          value={search ?? ""}
          onChange={(value) => setParams({ search: value || null })}
          placeholder="Search sales invoices…"
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
            ...INVOICE_DOCUMENT_STATUSES.map((status) => ({
              value: status,
              label: INVOICE_DOCUMENT_STATUS_LABELS[status],
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
              draftExtra.paymentStatus !== ALL,
              draftExtra.branchId !== ALL,
              draftExtra.currencyId !== ALL,
              Boolean(draftExtra.invoiceDateFrom),
              Boolean(draftExtra.invoiceDateTo),
            ].filter(Boolean).length
          }
          description="Filter by payment status, branch, currency, and invoice date."
          onOpen={() => setDraftExtra(extraFilters)}
          onApply={() =>
            setParams({
              filters: {
                payment_status:
                  draftExtra.paymentStatus === ALL ? null : draftExtra.paymentStatus,
                branch_id: draftExtra.branchId === ALL ? null : draftExtra.branchId,
                currency_id: draftExtra.currencyId === ALL ? null : draftExtra.currencyId,
                invoice_date_from: draftExtra.invoiceDateFrom || null,
                invoice_date_to: draftExtra.invoiceDateTo || null,
              },
            })
          }
          onClearDraft={() =>
            setDraftExtra({
              paymentStatus: ALL,
              branchId: ALL,
              currencyId: ALL,
              invoiceDateFrom: "",
              invoiceDateTo: "",
            })
          }
        >
          <FilterField label="Payment status" htmlFor="si-filter-payment">
            <FilterSelect
              id="si-filter-payment"
              className="w-full"
              placeholder="Payment status"
              value={draftExtra.paymentStatus}
              onValueChange={(value) =>
                setDraftExtra((current) => ({ ...current, paymentStatus: value }))
              }
              options={[
                { value: ALL, label: "All payment statuses" },
                ...PAYMENT_STATUSES.map((status) => ({
                  value: status,
                  label: PAYMENT_STATUS_LABELS[status],
                })),
              ]}
            />
          </FilterField>
          <FilterField label="Branch" htmlFor="si-filter-branch">
            <FilterSelect
              id="si-filter-branch"
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
          <FilterField label="Currency" htmlFor="si-filter-currency">
            <FilterSelect
              id="si-filter-currency"
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
            fromId="si-date-from"
            toId="si-date-to"
            fromLabel="Invoice from"
            toLabel="Invoice to"
            from={draftExtra.invoiceDateFrom}
            to={draftExtra.invoiceDateTo}
            onFromChange={(value) =>
              setDraftExtra((current) => ({ ...current, invoiceDateFrom: value }))
            }
            onToChange={(value) =>
              setDraftExtra((current) => ({ ...current, invoiceDateTo: value }))
            }
          />
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
                  payment_status: null,
                  branch_id: null,
                  currency_id: null,
                  invoice_date_from: null,
                  invoice_date_to: null,
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
          {invoicesQuery.isLoading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell colSpan={headers.length}>
                  <Skeleton className="h-6 w-full" />
                </TableCell>
              </TableRow>
            ))
          ) : invoicesQuery.isError ? (
            <TableRow>
              <TableCell colSpan={headers.length}>
                <DataTableError
                  message={getErrorMessage(invoicesQuery.error)}
                  onRetry={() => invoicesQuery.refetch()}
                />
              </TableCell>
            </TableRow>
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={headers.length}>
                <DataTableEmpty
                  title="No sales invoices"
                  message={emptyListMessage(canCreate, "Create a sales invoice to get started.")}
                />
              </TableCell>
            </TableRow>
          ) : (
            rows.map((invoice) => {
              const number = salesInvoiceDisplayNumber(invoice);
              const currencyCode = currencyCodeById.get(invoice.currency_id) ?? "";
              const overdue = isSalesInvoiceOverdue(invoice, today);
              return (
                <TableRow key={invoice.id}>
                  <TableCell className="font-mono text-sm">
                    <RecordLink href={`/sales-invoices/${invoice.id}`}>{number ?? "—"}</RecordLink>
                  </TableCell>
                  <TableCell className="font-medium">
                    <RecordLink href={`/sales-invoices/${invoice.id}`}>
                      {customerNameById.get(invoice.customer_id) ?? "—"}
                    </RecordLink>
                  </TableCell>
                  <TableCell>{formatDate(invoice.invoice_date)}</TableCell>
                  <TableCell>
                    {invoice.due_date ? formatDate(invoice.due_date) : "—"}
                    {overdue ? (
                      <span className="text-destructive ml-2 text-xs font-medium">Overdue</span>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap items-center gap-1">
                      <DocumentStatusBadge
                        status={invoice.status}
                        labels={INVOICE_DOCUMENT_STATUS_LABELS}
                        variants={INVOICE_DOCUMENT_STATUS_VARIANTS}
                      />
                      {invoice.is_fully_credited ? (
                        <DocumentStatusBadge
                          status="CREDITED"
                          labels={{ CREDITED: "Credited" }}
                          variants={{ CREDITED: "secondary" }}
                        />
                      ) : invoice.is_partially_credited ? (
                        <DocumentStatusBadge
                          status="PARTIALLY_CREDITED"
                          labels={{ PARTIALLY_CREDITED: "Partially credited" }}
                          variants={{ PARTIALLY_CREDITED: "warning" }}
                        />
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DocumentStatusBadge
                      status={invoice.payment_status}
                      labels={PAYMENT_STATUS_LABELS}
                      variants={PAYMENT_STATUS_VARIANTS}
                    />
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatMoney(invoice.grand_total, currencyCode)}
                  </TableCell>
                  {showActions ? (
                    <TableCell>
                      <DataTableRowActions
                        entityName={number ?? "invoice"}
                        viewHref={canRead ? `/sales-invoices/${invoice.id}` : undefined}
                        editHref={
                          canUpdate && invoice.status === "DRAFT"
                            ? `/sales-invoices/${invoice.id}/edit`
                            : undefined
                        }
                        onDelete={
                          invoice.available_actions.includes("delete") && canDelete
                            ? () => setDeleting(invoice)
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
        title={`${getDocumentAction(SALES_INVOICE_ACTION_REGISTRY, "delete").label} sales invoice ${deleting ? (salesInvoiceDisplayNumber(deleting) ?? "invoice") : "invoice"}`}
        description={
          deleting
            ? (getDocumentAction(SALES_INVOICE_ACTION_REGISTRY, "delete").confirmCopy?.(
                salesInvoiceDisplayNumber(deleting) ?? "invoice",
              ) ?? "")
            : ""
        }
        confirmLabel={getDocumentAction(SALES_INVOICE_ACTION_REGISTRY, "delete").label}
        pending={deleteInvoice.isPending}
        onOpenChange={(open) => {
          if (!open) {
            setDeleting(null);
          }
        }}
        onConfirm={() => void onDelete()}
      />
      <CreateSalesInvoiceFromQuotationDialog
        open={fromQuotation}
        onOpenChange={setFromQuotation}
      />
      <CreateInvoiceFromSalesOrderDialog
        open={fromSalesOrder}
        onOpenChange={setFromSalesOrder}
      />
      <CreateSalesInvoiceFromProformaDialog
        open={fromProforma}
        onOpenChange={setFromProforma}
      />
      <CreateInvoiceFromDeliveryNotesDialog
        open={fromDeliveryNotes}
        onOpenChange={setFromDeliveryNotes}
      />
    </ListPage>
  );
}
