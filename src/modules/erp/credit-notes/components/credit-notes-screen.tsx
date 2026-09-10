"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { useAllCustomers } from "@/modules/crm/customers/queries";
import { useAllCurrencies } from "@/modules/erp/currencies/queries";
import { useDeleteCreditNote } from "@/modules/erp/credit-notes/mutations";
import { creditNotePermissions } from "@/modules/erp/credit-notes/permissions";
import { useCreditNotes } from "@/modules/erp/credit-notes/queries";
import {
  CREDIT_NOTE_REASON_LABELS,
  INVOICE_DOCUMENT_STATUS_LABELS,
  INVOICE_DOCUMENT_STATUS_VARIANTS,
  INVOICE_DOCUMENT_STATUSES,
  creditNoteDisplayNumber,
  type CreditNote,
  type InvoiceDocumentStatus,
} from "@/modules/erp/credit-notes/schemas";
import { CREDIT_NOTE_ACTION_REGISTRY } from "@/modules/erp/credit-notes/workflow";
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

const COLUMN_HEADERS = ["Number", "Customer", "Date", "Reason", "Status", "Grand total"] as const;
const ALL = "all";
const SORT_FIELDS = [
  { value: "document_number", label: "Number" },
  { value: "credit_note_date", label: "Date" },
  { value: "status", label: "Status" },
  { value: "grand_total", label: "Grand total" },
] as const;
const SORT_FIELD_BY_HEADER: Partial<Record<string, string>> = {
  Number: "document_number",
  Date: "credit_note_date",
  Status: "status",
  "Grand total": "grand_total",
};

function parseStatus(value: string | undefined): InvoiceDocumentStatus | undefined {
  return INVOICE_DOCUMENT_STATUSES.includes(value as InvoiceDocumentStatus)
    ? (value as InvoiceDocumentStatus)
    : undefined;
}

export function CreditNotesScreen() {
  const { canCreate, canRead, canUpdate, canDelete } = useCrudPermissions(creditNotePermissions);
  const { page, page_size, search, sort_by, sort_order, filters, setParams, setPage } =
    useTableParams();
  const extraFilters = {
    currencyId: filters.currency_id ?? ALL,
    dateFrom: filters.credit_note_date_from ?? "",
    dateTo: filters.credit_note_date_to ?? "",
  };
  const extraCount = [
    extraFilters.currencyId !== ALL,
    Boolean(extraFilters.dateFrom),
    Boolean(extraFilters.dateTo),
  ].filter(Boolean).length;
  const [draftExtra, setDraftExtra] = useState(extraFilters);
  const notesQuery = useCreditNotes({
    page,
    page_size,
    search,
    sort_by,
    sort_order,
    status: parseStatus(filters.status),
    customer_id: filters.customer_id,
    currency_id: filters.currency_id,
    credit_note_date_from: filters.credit_note_date_from,
    credit_note_date_to: filters.credit_note_date_to,
  });
  const customersQuery = useAllCustomers();
  const currenciesQuery = useAllCurrencies();
  const deleteNote = useDeleteCreditNote();
  const [deleting, setDeleting] = useState<CreditNote | null>(null);

  const rows = notesQuery.data?.data ?? [];
  const meta = notesQuery.data?.meta;
  const customers = customersQuery.data ?? [];
  const currencies = currenciesQuery.data ?? [];
  const customerNameById = new Map(customers.map((customer) => [customer.id, customer.name]));
  const currencyCodeById = new Map(currencies.map((currency) => [currency.id, currency.code]));
  const showActions = hasRowActions(canRead, canUpdate, canCreate, canDelete);
  const headers = tableHeaders(COLUMN_HEADERS, showActions);

  async function onDelete() {
    if (!deleting) {
      return;
    }
    try {
      await deleteNote.mutateAsync({ id: deleting.id, version: deleting.version });
      toast.success("Credit note deleted");
      setDeleting(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <ListPage>
      <PageHeader
        title="Credit notes"
        subtitle="AR reductions. Posting reverses the receivable; stock will not move."
        actions={
          canCreate ? (
            <Button type="button" size="sm" asChild>
              <Link href="/credit-notes/new">
                <Plus className="size-3.5" />
                New credit note
              </Link>
            </Button>
          ) : undefined
        }
      />
      <DataTableToolbar>
        <ListSearch
          value={search ?? ""}
          onChange={(value) => setParams({ search: value || null })}
          placeholder="Search credit notes…"
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
              draftExtra.currencyId !== ALL,
              Boolean(draftExtra.dateFrom),
              Boolean(draftExtra.dateTo),
            ].filter(Boolean).length
          }
          description="Filter by currency and credit note date."
          onOpen={() => setDraftExtra(extraFilters)}
          onApply={() =>
            setParams({
              filters: {
                currency_id: draftExtra.currencyId === ALL ? null : draftExtra.currencyId,
                credit_note_date_from: draftExtra.dateFrom || null,
                credit_note_date_to: draftExtra.dateTo || null,
              },
            })
          }
          onClearDraft={() =>
            setDraftExtra({ currencyId: ALL, dateFrom: "", dateTo: "" })
          }
        >
          <FilterField label="Currency" htmlFor="cn-filter-currency">
            <FilterSelect
              id="cn-filter-currency"
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
            fromId="cn-date-from"
            toId="cn-date-to"
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
                  currency_id: null,
                  credit_note_date_from: null,
                  credit_note_date_to: null,
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
          {notesQuery.isLoading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell colSpan={headers.length}>
                  <Skeleton className="h-6 w-full" />
                </TableCell>
              </TableRow>
            ))
          ) : notesQuery.isError ? (
            <TableRow>
              <TableCell colSpan={headers.length}>
                <DataTableError
                  message={getErrorMessage(notesQuery.error)}
                  onRetry={() => notesQuery.refetch()}
                />
              </TableCell>
            </TableRow>
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={headers.length}>
                <DataTableEmpty
                  title="No credit notes"
                  message={emptyListMessage(canCreate, "Create a credit note to get started.")}
                />
              </TableCell>
            </TableRow>
          ) : (
            rows.map((note) => {
              const number = creditNoteDisplayNumber(note);
              const currencyCode = currencyCodeById.get(note.currency_id) ?? "";
              return (
                <TableRow key={note.id}>
                  <TableCell className="font-mono text-sm">
                    <RecordLink href={`/credit-notes/${note.id}`}>{number ?? "—"}</RecordLink>
                  </TableCell>
                  <TableCell className="font-medium">
                    <RecordLink href={`/credit-notes/${note.id}`}>
                      {customerNameById.get(note.customer_id) ?? "—"}
                    </RecordLink>
                  </TableCell>
                  <TableCell>{formatDate(note.credit_note_date)}</TableCell>
                  <TableCell>{CREDIT_NOTE_REASON_LABELS[note.reason_code]}</TableCell>
                  <TableCell>
                    <DocumentStatusBadge
                      status={note.status}
                      labels={INVOICE_DOCUMENT_STATUS_LABELS}
                      variants={INVOICE_DOCUMENT_STATUS_VARIANTS}
                    />
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatMoney(note.grand_total, currencyCode)}
                  </TableCell>
                  {showActions ? (
                    <TableCell>
                      <DataTableRowActions
                        entityName={number ?? "credit note"}
                        viewHref={canRead ? `/credit-notes/${note.id}` : undefined}
                        editHref={
                          canUpdate && note.status === "DRAFT"
                            ? `/credit-notes/${note.id}/edit`
                            : undefined
                        }
                        onDelete={
                          note.available_actions.includes("delete") && canDelete
                            ? () => setDeleting(note)
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
        title={`${getDocumentAction(CREDIT_NOTE_ACTION_REGISTRY, "delete").label} credit note ${deleting ? (creditNoteDisplayNumber(deleting) ?? "credit note") : "credit note"}`}
        description={
          deleting
            ? (getDocumentAction(CREDIT_NOTE_ACTION_REGISTRY, "delete").confirmCopy?.(
                creditNoteDisplayNumber(deleting) ?? "credit note",
              ) ?? "")
            : ""
        }
        confirmLabel={getDocumentAction(CREDIT_NOTE_ACTION_REGISTRY, "delete").label}
        pending={deleteNote.isPending}
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
