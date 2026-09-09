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
import { PROFORMA_INVOICE_ACTION_REGISTRY } from "@/modules/erp/proforma-invoices/workflow";
import { useCloneProformaInvoice, useDeleteProformaInvoice } from "@/modules/erp/proforma-invoices/mutations";
import { proformaInvoicePermissions } from "@/modules/erp/proforma-invoices/permissions";
import { useProformaInvoices } from "@/modules/erp/proforma-invoices/queries";
import {
  PROFORMA_INVOICE_STATUS_LABELS,
  PROFORMA_INVOICE_STATUS_VARIANTS,
  PROFORMA_INVOICE_STATUSES,
  proformaInvoiceDisplayNumber,
  type ProformaInvoice,
  type ProformaInvoiceStatus,
} from "@/modules/erp/proforma-invoices/schemas";
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
  { value: "proforma_date", label: "Date" },
  { value: "status", label: "Status" },
  { value: "grand_total", label: "Grand total" },
] as const;
const SORT_FIELD_BY_HEADER: Partial<Record<string, string>> = {
  Number: "document_number",
  Date: "proforma_date",
  Status: "status",
  "Grand total": "grand_total",
};

function parseStatus(value: string | undefined): ProformaInvoiceStatus | undefined {
  return PROFORMA_INVOICE_STATUSES.includes(value as ProformaInvoiceStatus)
    ? (value as ProformaInvoiceStatus)
    : undefined;
}

export function ProformaInvoicesScreen() {
  const { canCreate, canRead, canUpdate, canDelete } = useCrudPermissions(proformaInvoicePermissions);
  const router = useRouter();
  const { page, page_size, search, sort_by, sort_order, filters, setParams, setPage } =
    useTableParams();
  const extraFilters = {
    branchId: filters.branch_id ?? ALL,
    currencyId: filters.currency_id ?? ALL,
  };
  const extraCount = [extraFilters.branchId !== ALL, extraFilters.currencyId !== ALL].filter(
    Boolean,
  ).length;
  const [draftExtra, setDraftExtra] = useState({ branchId: ALL, currencyId: ALL });
  const invoicesQuery = useProformaInvoices({
    page,
    page_size,
    search,
    sort_by,
    sort_order,
    status: parseStatus(filters.status),
    customer_id: filters.customer_id,
    branch_id: filters.branch_id,
    currency_id: filters.currency_id,
  });
  const customersQuery = useAllCustomers();
  const currenciesQuery = useAllCurrencies();
  const branchesQuery = useAllBranches();
  const cloneInvoice = useCloneProformaInvoice();
  const deleteInvoice = useDeleteProformaInvoice();
  const [deleting, setDeleting] = useState<ProformaInvoice | null>(null);

  const rows = invoicesQuery.data?.data ?? [];
  const meta = invoicesQuery.data?.meta;
  const customers = customersQuery.data ?? [];
  const currencies = currenciesQuery.data ?? [];
  const branches = branchesQuery.data ?? [];
  const customerNameById = new Map(customers.map((customer) => [customer.id, customer.name]));
  const currencyCodeById = new Map(currencies.map((currency) => [currency.id, currency.code]));
  const showActions = hasRowActions(canRead, canUpdate, canCreate, canDelete);
  const headers = tableHeaders(COLUMN_HEADERS, showActions);

  async function onClone(id: string) {
    try {
      const cloned = await cloneInvoice.mutateAsync(id);
      toast.success("Proforma invoice cloned");
      router.push(`/proforma-invoices/${cloned.id}`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  async function onDelete() {
    if (!deleting) {
      return;
    }
    try {
      await deleteInvoice.mutateAsync({ id: deleting.id, version: deleting.version });
      toast.success("Proforma invoice deleted");
      setDeleting(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <ListPage>
      <PageHeader
        title="Proforma invoices"
        subtitle="Export-facing invoices with payment milestones"
        actions={
          canCreate ? (
            <Button type="button" size="sm" asChild>
              <Link href="/proforma-invoices/new">
                <Plus className="size-3.5" />
                New proforma invoice
              </Link>
            </Button>
          ) : undefined
        }
      />
      <DataTableToolbar>
        <ListSearch
          value={search ?? ""}
          onChange={(value) => setParams({ search: value || null })}
          placeholder="Search proforma invoices…"
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
            ...PROFORMA_INVOICE_STATUSES.map((status) => ({
              value: status,
              label: PROFORMA_INVOICE_STATUS_LABELS[status],
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
            [draftExtra.branchId !== ALL, draftExtra.currencyId !== ALL].filter(Boolean).length
          }
          description="Filter by branch and currency."
          onOpen={() => setDraftExtra(extraFilters)}
          onApply={() =>
            setParams({
              filters: {
                branch_id: draftExtra.branchId === ALL ? null : draftExtra.branchId,
                currency_id: draftExtra.currencyId === ALL ? null : draftExtra.currencyId,
              },
            })
          }
          onClearDraft={() => setDraftExtra({ branchId: ALL, currencyId: ALL })}
        >
          <FilterField label="Branch" htmlFor="pfi-filter-branch">
            <FilterSelect
              id="pfi-filter-branch"
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
          <FilterField label="Currency" htmlFor="pfi-filter-currency">
            <FilterSelect
              id="pfi-filter-currency"
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
                  branch_id: null,
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
                  title="No proforma invoices"
                  message={emptyListMessage(canCreate, "Create a proforma invoice to get started.")}
                />
              </TableCell>
            </TableRow>
          ) : (
            rows.map((invoice) => {
              const number = proformaInvoiceDisplayNumber(invoice);
              const currencyCode = currencyCodeById.get(invoice.currency_id) ?? "";
              return (
                <TableRow key={invoice.id}>
                  <TableCell className="font-mono text-sm">
                    <RecordLink href={`/proforma-invoices/${invoice.id}`}>{number ?? "—"}</RecordLink>
                  </TableCell>
                  <TableCell className="font-medium">
                    <RecordLink href={`/proforma-invoices/${invoice.id}`}>
                      {customerNameById.get(invoice.customer_id) ?? "—"}
                    </RecordLink>
                  </TableCell>
                  <TableCell>{formatDate(invoice.proforma_date)}</TableCell>
                  <TableCell>
                    <DocumentStatusBadge
                      status={invoice.status}
                      labels={PROFORMA_INVOICE_STATUS_LABELS}
                      variants={PROFORMA_INVOICE_STATUS_VARIANTS}
                    />
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatMoney(invoice.grand_total, currencyCode)}
                  </TableCell>
                  {showActions ? (
                    <TableCell>
                      <DataTableRowActions
                        entityName={number ?? "invoice"}
                        viewHref={canRead ? `/proforma-invoices/${invoice.id}` : undefined}
                        editHref={
                          canUpdate && invoice.status === "DRAFT"
                            ? `/proforma-invoices/${invoice.id}/edit`
                            : undefined
                        }
                        extra={
                          invoice.available_actions.includes("clone") && canCreate ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="size-7"
                              aria-label="Clone proforma invoice"
                              disabled={cloneInvoice.isPending}
                              onClick={() => void onClone(invoice.id)}
                            >
                              <Copy className="size-3.5" />
                            </Button>
                          ) : undefined
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
        title={`${getDocumentAction(PROFORMA_INVOICE_ACTION_REGISTRY, "delete").label} proforma invoice ${deleting ? (proformaInvoiceDisplayNumber(deleting) ?? "invoice") : "invoice"}`}
        description={
          deleting
            ? (getDocumentAction(PROFORMA_INVOICE_ACTION_REGISTRY, "delete").confirmCopy?.(
                proformaInvoiceDisplayNumber(deleting) ?? "invoice",
              ) ?? "")
            : ""
        }
        confirmLabel={getDocumentAction(PROFORMA_INVOICE_ACTION_REGISTRY, "delete").label}
        pending={deleteInvoice.isPending}
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
