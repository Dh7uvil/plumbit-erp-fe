"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { useAllSuppliers } from "@/modules/erp/suppliers/queries";
import { useAllCurrencies } from "@/modules/erp/currencies/queries";
import { useAllBranches } from "@/modules/users-management/branches/queries";
import { useDeleteDebitNote } from "@/modules/erp/debit-notes/mutations";
import { debitNotePermissions } from "@/modules/erp/debit-notes/permissions";
import { useDebitNotes } from "@/modules/erp/debit-notes/queries";
import {
  DEBIT_NOTE_REASON_LABELS,
  INVOICE_DOCUMENT_STATUS_LABELS,
  INVOICE_DOCUMENT_STATUS_VARIANTS,
  INVOICE_DOCUMENT_STATUSES,
  debitNoteDisplayNumber,
  type DebitNote,
  type InvoiceDocumentStatus,
} from "@/modules/erp/debit-notes/schemas";
import { DEBIT_NOTE_ACTION_REGISTRY } from "@/modules/erp/debit-notes/workflow";
import { getErrorMessage } from "@/shared/api/errors";
import { emptyListMessage, useCrudPermissions } from "@/shared/auth/use-crud-permissions";
import { DataTableColumnHeads, DataTableCells } from "@/shared/components/data-table/column-cells";
import {
  auditActorColumns,
  auditTimestampColumns,
  useUserNameMap,
} from "@/shared/components/data-table/audit-columns";
import {
  actionsColumn,
  type DataTableColumn,
} from "@/shared/components/data-table/columns";
import { DataTable } from "@/shared/components/data-table/data-table";
import { DateRangeFilter } from "@/shared/components/data-table/date-range-filter";
import { FilterSelect } from "@/shared/components/data-table/filter-select";
import { ListSearch } from "@/shared/components/data-table/list-search";
import { FilterField, MoreFiltersDialog } from "@/shared/components/data-table/more-filters-dialog";
import { DataTablePagination } from "@/shared/components/data-table/pagination";
import { RecordLink } from "@/shared/components/data-table/record-link";
import { DataTableRowActions, hasRowActions } from "@/shared/components/data-table/row-actions";
import { SortDialog } from "@/shared/components/data-table/sort-dialog";
import { DataTableEmpty, DataTableError } from "@/shared/components/data-table/states";
import { DocumentStatusBadge } from "@/shared/components/document/document-status-badge";
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
import { formatDate, formatMoney } from "@/shared/lib/format";

const ALL = "all";
const SORT_FIELDS = [
  { value: "document_number", label: "Number" },
  { value: "debit_note_date", label: "Date" },
  { value: "status", label: "Status" },
  { value: "grand_total", label: "Grand total" },
] as const;

function parseStatus(value: string | undefined): InvoiceDocumentStatus | undefined {
  return INVOICE_DOCUMENT_STATUSES.includes(value as InvoiceDocumentStatus)
    ? (value as InvoiceDocumentStatus)
    : undefined;
}

export function DebitNotesScreen() {
  const { canCreate, canRead, canUpdate, canDelete } = useCrudPermissions(debitNotePermissions);
  const { page, page_size, search, sort_by, sort_order, filters, setParams, setPage } =
    useTableParams();
  const extraFilters = {
    currencyId: filters.currency_id ?? ALL,
    dateFrom: filters.debit_note_date_from ?? "",
    dateTo: filters.debit_note_date_to ?? "",
  };
  const extraCount = [
    extraFilters.currencyId !== ALL,
    Boolean(extraFilters.dateFrom),
    Boolean(extraFilters.dateTo),
  ].filter(Boolean).length;
  const [draftExtra, setDraftExtra] = useState(extraFilters);
  const notesQuery = useDebitNotes({
    page,
    page_size,
    search,
    sort_by,
    sort_order,
    status: parseStatus(filters.status),
    supplier_id: filters.supplier_id,
    currency_id: filters.currency_id,
    debit_note_date_from: filters.debit_note_date_from,
    debit_note_date_to: filters.debit_note_date_to,
  });
  const suppliersQuery = useAllSuppliers();
  const currenciesQuery = useAllCurrencies();
  const branchesQuery = useAllBranches();
  const deleteNote = useDeleteDebitNote();
  const [deleting, setDeleting] = useState<DebitNote | null>(null);

  const rows = notesQuery.data?.data ?? [];
  const meta = notesQuery.data?.meta;
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
  const branchNameById = useMemo(
    () => new Map((branchesQuery.data ?? []).map((branch) => [branch.id, branch.name])),
    [branchesQuery.data],
  );
  const userNameById = useUserNameMap();
  const showActions = hasRowActions(canRead, canUpdate, canCreate, canDelete);

  async function onDelete() {
    if (!deleting) {
      return;
    }
    try {
      await deleteNote.mutateAsync({ id: deleting.id, version: deleting.version });
      toast.success("Debit note deleted");
      setDeleting(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  const columnDefs = useMemo((): Array<DataTableColumn<DebitNote>> => {
    return [
      {
        id: "document_number",
        header: "Number",
        sortableField: "document_number",
        className: "font-mono text-sm",
        cell: (note) => {
          const number = debitNoteDisplayNumber(note);
          return <RecordLink href={`/debit-notes/${note.id}`}>{number ?? "—"}</RecordLink>;
        },
      },
      {
        id: "supplier",
        header: "Supplier",
        className: "font-medium",
        cell: (note) => (
          <RecordLink href={`/debit-notes/${note.id}`}>
            {supplierNameById.get(note.supplier_id) ?? "—"}
          </RecordLink>
        ),
      },
      {
        id: "document_date",
        header: "Date",
        sortableField: "debit_note_date",
        cell: (note) => formatDate(note.debit_note_date),
      },
      {
        id: "reason",
        header: "Reason",
        cell: (note) => DEBIT_NOTE_REASON_LABELS[note.reason_code],
      },
      {
        id: "status",
        header: "Status",
        sortableField: "status",
        cell: (note) => (
          <DocumentStatusBadge
            status={note.status}
            labels={INVOICE_DOCUMENT_STATUS_LABELS}
            variants={INVOICE_DOCUMENT_STATUS_VARIANTS}
          />
        ),
      },
      {
        id: "grand_total",
        header: "Grand total",
        sortableField: "grand_total",
        headerClassName: "text-right",
        className: "text-right tabular-nums",
        cell: (note) =>
          formatMoney(note.grand_total, currencyCodeById.get(note.currency_id) ?? ""),
      },
      {
        id: "is_posted",
        header: "Posted",
        defaultVisible: false,
        cell: (note) => (note.is_posted ? "Posted" : "Draft"),
      },
      {
        id: "currency",
        header: "Currency",
        defaultVisible: false,
        cell: (note) => currencyCodeById.get(note.currency_id) ?? "—",
      },
      {
        id: "branch",
        header: "Branch",
        defaultVisible: false,
        cell: (note) =>
          note.branch_id ? (branchNameById.get(note.branch_id) ?? "—") : "—",
      },
      {
        id: "exchange_rate",
        header: "Exchange rate",
        defaultVisible: false,
        className: "tabular-nums",
        cell: (note) => note.exchange_rate,
      },
      {
        id: "notes",
        header: "Notes",
        defaultVisible: false,
        className: "max-w-xs truncate",
        cell: (note) => note.notes || "—",
      },
      {
        id: "subtotal",
        header: "Subtotal",
        defaultVisible: false,
        headerClassName: "text-right",
        className: "text-right tabular-nums",
        cell: (note) =>
          formatMoney(note.subtotal, currencyCodeById.get(note.currency_id) ?? ""),
      },
      {
        id: "tax_amount",
        header: "Tax",
        defaultVisible: false,
        headerClassName: "text-right",
        className: "text-right tabular-nums",
        cell: (note) =>
          formatMoney(note.tax_amount, currencyCodeById.get(note.currency_id) ?? ""),
      },
      {
        id: "amount_applied",
        header: "Amount applied",
        defaultVisible: false,
        headerClassName: "text-right",
        className: "text-right tabular-nums",
        cell: (note) =>
          formatMoney(note.amount_applied, currencyCodeById.get(note.currency_id) ?? ""),
      },
      ...auditTimestampColumns<DebitNote>(),
      ...auditActorColumns<DebitNote>(userNameById),
      ...actionsColumn<DebitNote>(showActions, (note) => {
        const number = debitNoteDisplayNumber(note);
        return (
          <DataTableRowActions
            entityName={number}
            viewHref={canRead ? `/debit-notes/${note.id}` : undefined}
            editHref={
              canUpdate && note.status === "DRAFT" ? `/debit-notes/${note.id}/edit` : undefined
            }
            onDelete={
              note.available_actions.includes("delete") && canDelete
                ? () => setDeleting(note)
                : undefined
            }
          />
        );
      }),
    ];
  }, [
    branchNameById,
    canDelete,
    canRead,
    canUpdate,
    currencyCodeById,
    showActions,
    supplierNameById,
    userNameById,
  ]);

  const { columns, columnsDialog, colSpan } = useTableColumns("erp.debit_notes", columnDefs);

  return (
    <ListPage>
      <PageHeader
        title="Debit notes"
        subtitle="Debit notes reduce what you owe a supplier. Posting does not move stock."
        actions={
          canCreate ? (
            <Button type="button" size="sm" asChild>
              <Link href="/debit-notes/new">
                <Plus className="size-3.5" />
                New debit note
              </Link>
            </Button>
          ) : undefined
        }
      />
      <DataTableToolbar>
        <ListSearch
          value={search ?? ""}
          onChange={(value) => setParams({ search: value || null })}
          placeholder="Search number, supplier, bill…"
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
              Boolean(draftExtra.dateFrom),
              Boolean(draftExtra.dateTo),
            ].filter(Boolean).length
          }
          description="Filter by currency and debit note date."
          onOpen={() => setDraftExtra(extraFilters)}
          onApply={() =>
            setParams({
              filters: {
                currency_id: draftExtra.currencyId === ALL ? null : draftExtra.currencyId,
                debit_note_date_from: draftExtra.dateFrom || null,
                debit_note_date_to: draftExtra.dateTo || null,
              },
            })
          }
          onClearDraft={() =>
            setDraftExtra({ currencyId: ALL, dateFrom: "", dateTo: "" })
          }
        >
          <FilterField label="Currency" htmlFor="sdn-filter-currency">
            <FilterSelect
              id="sdn-filter-currency"
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
            fromId="sdn-date-from"
            toId="sdn-date-to"
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
                  currency_id: null,
                  debit_note_date_from: null,
                  debit_note_date_to: null,
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
          {notesQuery.isLoading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell colSpan={colSpan}>
                  <Skeleton className="h-6 w-full" />
                </TableCell>
              </TableRow>
            ))
          ) : notesQuery.isError ? (
            <TableRow>
              <TableCell colSpan={colSpan}>
                <DataTableError
                  message={getErrorMessage(notesQuery.error)}
                  onRetry={() => notesQuery.refetch()}
                />
              </TableCell>
            </TableRow>
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={colSpan}>
                <DataTableEmpty
                  title="No debit notes"
                  message={emptyListMessage(canCreate, "Create a debit note to get started.")}
                />
              </TableCell>
            </TableRow>
          ) : (
            rows.map((note) => (
              <TableRow key={note.id}>
                <DataTableCells columns={columns} row={note} />
              </TableRow>
            ))
          )}
        </TableBody>
      </DataTable>
      <ConfirmActionDialog
        open={Boolean(deleting)}
        title={`${getDocumentAction(DEBIT_NOTE_ACTION_REGISTRY, "delete").label} debit note ${deleting ? (debitNoteDisplayNumber(deleting) ?? "debit note") : "debit note"}`}
        description={
          deleting
            ? (getDocumentAction(DEBIT_NOTE_ACTION_REGISTRY, "delete").confirmCopy?.(
                debitNoteDisplayNumber(deleting) ?? "debit note",
              ) ?? "")
            : ""
        }
        confirmLabel={getDocumentAction(DEBIT_NOTE_ACTION_REGISTRY, "delete").label}
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
