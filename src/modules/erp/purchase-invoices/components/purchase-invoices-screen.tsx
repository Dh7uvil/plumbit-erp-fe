"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { useAllCurrencies } from "@/modules/erp/currencies/queries";
import { CreateBillFromGoodsReceiptDialog } from "@/modules/erp/purchase-invoices/components/create-from-goods-receipt-dialog";
import { CreateBillFromPurchaseOrderDialog } from "@/modules/erp/purchase-invoices/components/create-from-purchase-order-dialog";
import { useDeletePurchaseInvoice } from "@/modules/erp/purchase-invoices/mutations";
import { purchaseInvoicePermissions } from "@/modules/erp/purchase-invoices/permissions";
import { usePurchaseInvoices } from "@/modules/erp/purchase-invoices/queries";
import {
  BILL_TYPE_LABELS,
  BILL_TYPES,
  INVOICE_DOCUMENT_STATUS_LABELS,
  INVOICE_DOCUMENT_STATUS_VARIANTS,
  INVOICE_DOCUMENT_STATUSES,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_VARIANTS,
  PAYMENT_STATUSES,
  isPurchaseInvoiceOverdue,
  purchaseInvoiceDisplayNumber,
  type BillType,
  type InvoiceDocumentStatus,
  type PaymentStatus,
  type PurchaseInvoice,
} from "@/modules/erp/purchase-invoices/schemas";
import { PURCHASE_INVOICE_ACTION_REGISTRY } from "@/modules/erp/purchase-invoices/workflow";
import { useAllSuppliers } from "@/modules/erp/suppliers/queries";
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
import { DocumentStatusBadge } from "@/shared/components/document/document-status-badge";
import { getDocumentAction } from "@/shared/components/document/workflow-registry";
import { ConfirmActionDialog } from "@/shared/components/feedback/confirm-action-dialog";
import { DataTableToolbar } from "@/shared/components/data-table/toolbar";
import { ListPage } from "@/shared/components/layout/list-page";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Button } from "@/shared/components/ui/button";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { TableBody, TableCell, TableHeader, TableRow } from "@/shared/components/ui/table";
import { useTableParams } from "@/shared/hooks/use-table-params";
import { formatDate, formatMoney } from "@/shared/lib/format";

const COLUMN_HEADERS = [
  "Number",
  "Supplier",
  "Date",
  "Type",
  "Status",
  "Payment",
  "Grand total",
] as const;
const ALL = "all";
const SORT_FIELDS = [
  { value: "document_number", label: "Number" },
  { value: "invoice_date", label: "Date" },
  { value: "status", label: "Status" },
  { value: "grand_total", label: "Grand total" },
] as const;
const SORT_FIELD_BY_HEADER: Partial<Record<string, string>> = {
  Number: "document_number",
  Date: "invoice_date",
  Status: "status",
  "Grand total": "grand_total",
};

function todayIsoDate(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function parseStatus(value: string | undefined): InvoiceDocumentStatus | undefined {
  return INVOICE_DOCUMENT_STATUSES.includes(value as InvoiceDocumentStatus)
    ? (value as InvoiceDocumentStatus)
    : undefined;
}

function parsePaymentStatus(value: string | undefined): PaymentStatus | undefined {
  return PAYMENT_STATUSES.includes(value as PaymentStatus) ? (value as PaymentStatus) : undefined;
}

function parseBillType(value: string | undefined): BillType | undefined {
  return BILL_TYPES.includes(value as BillType) ? (value as BillType) : undefined;
}

export function PurchaseInvoicesScreen() {
  const { canCreate, canRead, canUpdate, canDelete } = useCrudPermissions(
    purchaseInvoicePermissions,
  );
  const { page, page_size, search, sort_by, sort_order, filters, setParams, setPage } =
    useTableParams();
  const extraFilters = {
    paymentStatus: filters.payment_status ?? ALL,
    billType: filters.bill_type ?? ALL,
    invoiceDateFrom: filters.invoice_date_from ?? "",
    invoiceDateTo: filters.invoice_date_to ?? "",
  };
  const extraCount = [
    extraFilters.paymentStatus !== ALL,
    extraFilters.billType !== ALL,
    Boolean(extraFilters.invoiceDateFrom),
    Boolean(extraFilters.invoiceDateTo),
  ].filter(Boolean).length;
  const [draftExtra, setDraftExtra] = useState(extraFilters);
  const [fromPo, setFromPo] = useState(false);
  const [fromGrn, setFromGrn] = useState(false);
  const invoicesQuery = usePurchaseInvoices({
    page,
    page_size,
    search,
    sort_by,
    sort_order,
    status: parseStatus(filters.status),
    supplier_id: filters.supplier_id,
    payment_status: parsePaymentStatus(filters.payment_status),
    bill_type: parseBillType(filters.bill_type),
    invoice_date_from: filters.invoice_date_from,
    invoice_date_to: filters.invoice_date_to,
  });
  const suppliersQuery = useAllSuppliers();
  const currenciesQuery = useAllCurrencies();
  const deleteInvoice = useDeletePurchaseInvoice();
  const [deleting, setDeleting] = useState<PurchaseInvoice | null>(null);
  const today = todayIsoDate();

  const rows = invoicesQuery.data?.data ?? [];
  const meta = invoicesQuery.data?.meta;
  const suppliers = suppliersQuery.data ?? [];
  const currencies = currenciesQuery.data ?? [];
  const supplierNameById = new Map(suppliers.map((supplier) => [supplier.id, supplier.name]));
  const currencyCodeById = new Map(currencies.map((currency) => [currency.id, currency.code]));
  const showActions = hasRowActions(canRead, canUpdate, canCreate, canDelete);
  const headers = tableHeaders(COLUMN_HEADERS, showActions);

  async function onDelete() {
    if (!deleting) {
      return;
    }
    try {
      await deleteInvoice.mutateAsync({ id: deleting.id, version: deleting.version });
      toast.success("Purchase invoice deleted");
      setDeleting(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <ListPage>
      <PageHeader
        title="Purchase invoices"
        subtitle="Supplier bills. Posting moves AP and GRNI, not stock."
        actions={
          canCreate ? (
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setFromPo(true)}>
                From purchase order
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => setFromGrn(true)}>
                From goods receipt
              </Button>
              <Button type="button" size="sm" asChild>
                <Link href="/purchase-invoices/new">
                  <Plus className="size-3.5" />
                  New purchase invoice
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
          placeholder="Search purchase invoices…"
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
              draftExtra.paymentStatus !== ALL,
              draftExtra.billType !== ALL,
              Boolean(draftExtra.invoiceDateFrom),
              Boolean(draftExtra.invoiceDateTo),
            ].filter(Boolean).length
          }
          description="Filter by bill type, payment status, and invoice date."
          onOpen={() => setDraftExtra(extraFilters)}
          onApply={() =>
            setParams({
              filters: {
                payment_status:
                  draftExtra.paymentStatus === ALL ? null : draftExtra.paymentStatus,
                bill_type: draftExtra.billType === ALL ? null : draftExtra.billType,
                invoice_date_from: draftExtra.invoiceDateFrom || null,
                invoice_date_to: draftExtra.invoiceDateTo || null,
              },
            })
          }
          onClearDraft={() =>
            setDraftExtra({
              paymentStatus: ALL,
              billType: ALL,
              invoiceDateFrom: "",
              invoiceDateTo: "",
            })
          }
        >
          <FilterField label="Bill type" htmlFor="pi-filter-type">
            <FilterSelect
              id="pi-filter-type"
              className="w-full"
              placeholder="Bill type"
              value={draftExtra.billType}
              onValueChange={(value) =>
                setDraftExtra((current) => ({ ...current, billType: value }))
              }
              options={[
                { value: ALL, label: "All types" },
                ...BILL_TYPES.map((type) => ({ value: type, label: BILL_TYPE_LABELS[type] })),
              ]}
            />
          </FilterField>
          <FilterField label="Payment status" htmlFor="pi-filter-payment">
            <FilterSelect
              id="pi-filter-payment"
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
          <DateRangeFilter
            fromId="pi-date-from"
            toId="pi-date-to"
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
                  payment_status: null,
                  bill_type: null,
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
                  title="No purchase invoices"
                  message={emptyListMessage(canCreate, "Create a purchase invoice to get started.")}
                />
              </TableCell>
            </TableRow>
          ) : (
            rows.map((invoice) => {
              const number = purchaseInvoiceDisplayNumber(invoice);
              const currencyCode = currencyCodeById.get(invoice.currency_id) ?? "";
              const overdue = isPurchaseInvoiceOverdue(invoice, today);
              return (
                <TableRow key={invoice.id}>
                  <TableCell className="font-mono text-sm">
                    <RecordLink href={`/purchase-invoices/${invoice.id}`}>
                      {number ?? "—"}
                    </RecordLink>
                  </TableCell>
                  <TableCell className="font-medium">
                    <RecordLink href={`/purchase-invoices/${invoice.id}`}>
                      {supplierNameById.get(invoice.supplier_id) ?? "—"}
                    </RecordLink>
                  </TableCell>
                  <TableCell>
                    {formatDate(invoice.invoice_date)}
                    {overdue ? (
                      <span className="text-destructive ml-2 text-xs font-medium">Overdue</span>
                    ) : null}
                  </TableCell>
                  <TableCell>{BILL_TYPE_LABELS[invoice.bill_type]}</TableCell>
                  <TableCell>
                    <DocumentStatusBadge
                      status={invoice.status}
                      labels={INVOICE_DOCUMENT_STATUS_LABELS}
                      variants={INVOICE_DOCUMENT_STATUS_VARIANTS}
                    />
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
                        entityName={number ?? "bill"}
                        viewHref={canRead ? `/purchase-invoices/${invoice.id}` : undefined}
                        editHref={
                          canUpdate && invoice.status === "DRAFT"
                            ? `/purchase-invoices/${invoice.id}/edit`
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
        title={`${getDocumentAction(PURCHASE_INVOICE_ACTION_REGISTRY, "delete").label} purchase invoice ${deleting ? (purchaseInvoiceDisplayNumber(deleting) ?? "bill") : "bill"}`}
        description={
          deleting
            ? (getDocumentAction(PURCHASE_INVOICE_ACTION_REGISTRY, "delete").confirmCopy?.(
                purchaseInvoiceDisplayNumber(deleting) ?? "bill",
              ) ?? "")
            : ""
        }
        confirmLabel={getDocumentAction(PURCHASE_INVOICE_ACTION_REGISTRY, "delete").label}
        pending={deleteInvoice.isPending}
        onOpenChange={(open) => {
          if (!open) {
            setDeleting(null);
          }
        }}
        onConfirm={() => void onDelete()}
      />
      <CreateBillFromPurchaseOrderDialog open={fromPo} onOpenChange={setFromPo} />
      <CreateBillFromGoodsReceiptDialog open={fromGrn} onOpenChange={setFromGrn} />
    </ListPage>
  );
}
