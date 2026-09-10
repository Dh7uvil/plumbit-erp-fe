"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { useDeleteJournal } from "@/modules/erp/accounting/journals/mutations";
import { journalPermissions } from "@/modules/erp/accounting/journals/permissions";
import { useJournals } from "@/modules/erp/accounting/journals/queries";
import {
  JOURNAL_STATUS_LABELS,
  JOURNAL_STATUS_VARIANTS,
  JOURNAL_STATUSES,
  JOURNAL_TYPE_LABELS,
  JOURNAL_TYPES,
  type JournalEntry,
  type JournalStatus,
  type JournalType,
} from "@/modules/erp/accounting/journals/schemas";
import { getErrorMessage } from "@/shared/api/errors";
import { emptyListMessage, useCrudPermissions } from "@/shared/auth/use-crud-permissions";
import { DataTable } from "@/shared/components/data-table/data-table";
import { DateRangeFilter } from "@/shared/components/data-table/date-range-filter";
import { FilterSelect } from "@/shared/components/data-table/filter-select";
import { ListSearch } from "@/shared/components/data-table/list-search";
import { MoreFiltersDialog } from "@/shared/components/data-table/more-filters-dialog";
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
import { DataTableToolbar } from "@/shared/components/data-table/toolbar";
import { DocumentStatusBadge } from "@/shared/components/document/document-status-badge";
import { ConfirmActionDialog } from "@/shared/components/feedback/confirm-action-dialog";
import { ListPage } from "@/shared/components/layout/list-page";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Button } from "@/shared/components/ui/button";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { TableBody, TableCell, TableHeader, TableRow } from "@/shared/components/ui/table";
import { useTableParams } from "@/shared/hooks/use-table-params";
import { formatDate, formatDecimal } from "@/shared/lib/format";

const COLUMN_HEADERS = ["Number", "Date", "Type", "Status", "Debit", "Credit"] as const;
const ALL = "all";
const EMPTY_EXTRA = { entryDateFrom: "", entryDateTo: "" };

function isStatus(value: string | undefined): value is JournalStatus {
  return Boolean(value && JOURNAL_STATUSES.includes(value as JournalStatus));
}

function isType(value: string | undefined): value is JournalType {
  return Boolean(value && JOURNAL_TYPES.includes(value as JournalType));
}

export function JournalsScreen() {
  const { canCreate, canRead, canUpdate, canDelete } = useCrudPermissions(journalPermissions);
  const { page, page_size, search, sort_by, sort_order, filters, setParams, setPage } =
    useTableParams();
  const extraFilters = {
    entryDateFrom: filters.entry_date_from ?? "",
    entryDateTo: filters.entry_date_to ?? "",
  };
  const extraCount = [extraFilters.entryDateFrom, extraFilters.entryDateTo].filter(Boolean).length;
  const [draftExtra, setDraftExtra] = useState(EMPTY_EXTRA);
  const journalsQuery = useJournals({
    page,
    page_size,
    search,
    sort_by,
    sort_order,
    status: isStatus(filters.status) ? filters.status : undefined,
    journal_type: isType(filters.journal_type) ? filters.journal_type : undefined,
    entry_date_from: filters.entry_date_from,
    entry_date_to: filters.entry_date_to,
  });
  const deleteJournal = useDeleteJournal();
  const [deleting, setDeleting] = useState<JournalEntry | null>(null);
  const showActions = hasRowActions(canRead, canUpdate, canDelete);
  const headers = tableHeaders(COLUMN_HEADERS, showActions);
  const rows = journalsQuery.data?.data ?? [];
  const meta = journalsQuery.data?.meta;

  async function confirmDelete() {
    if (!deleting) {
      return;
    }
    try {
      await deleteJournal.mutateAsync({ id: deleting.id, version: deleting.version });
      toast.success("Journal deleted");
      setDeleting(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <ListPage>
      <PageHeader
        title="Journals"
        subtitle="Manual journal entries posted through the ledger"
        actions={
          canCreate ? (
            <Button type="button" size="sm" asChild>
              <Link href="/journals/new">
                <Plus className="size-3.5" />
                New journal
              </Link>
            </Button>
          ) : undefined
        }
      />
      <DataTableToolbar>
        <ListSearch
          value={search ?? ""}
          onChange={(value) => setParams({ search: value || null })}
          placeholder="Search journals…"
        />
        <FilterSelect
          className="w-36"
          placeholder="Status"
          aria-label="Filter by status"
          value={filters.status ?? ALL}
          onValueChange={(value) => setParams({ filters: { status: value === ALL ? null : value } })}
          options={[
            { value: ALL, label: "All statuses" },
            ...JOURNAL_STATUSES.map((status) => ({
              value: status,
              label: JOURNAL_STATUS_LABELS[status],
            })),
          ]}
        />
        <FilterSelect
          className="w-44"
          placeholder="Type"
          aria-label="Filter by type"
          value={filters.journal_type ?? ALL}
          onValueChange={(value) =>
            setParams({ filters: { journal_type: value === ALL ? null : value } })
          }
          options={[
            { value: ALL, label: "All types" },
            ...JOURNAL_TYPES.map((type) => ({ value: type, label: JOURNAL_TYPE_LABELS[type] })),
          ]}
        />
        <MoreFiltersDialog
          extraCount={extraCount}
          draftCount={[draftExtra.entryDateFrom, draftExtra.entryDateTo].filter(Boolean).length}
          description="Filter by entry date."
          onOpen={() => setDraftExtra(extraFilters)}
          onApply={() =>
            setParams({
              filters: {
                entry_date_from: draftExtra.entryDateFrom || null,
                entry_date_to: draftExtra.entryDateTo || null,
              },
            })
          }
          onClearDraft={() => setDraftExtra(EMPTY_EXTRA)}
        >
          <DateRangeFilter
            fromId="jv-from"
            toId="jv-to"
            from={draftExtra.entryDateFrom}
            to={draftExtra.entryDateTo}
            onFromChange={(value) =>
              setDraftExtra((current) => ({ ...current, entryDateFrom: value }))
            }
            onToChange={(value) => setDraftExtra((current) => ({ ...current, entryDateTo: value }))}
          />
        </MoreFiltersDialog>
        <SortDialog
          fields={[
            { value: "document_number", label: "Number" },
            { value: "entry_date", label: "Date" },
            { value: "status", label: "Status" },
          ]}
          sortBy={sort_by}
          sortOrder={sort_order}
          onApply={setParams}
        />
        {search || filters.status || filters.journal_type || extraCount > 0 || sort_by ? (
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
                  journal_type: null,
                  entry_date_from: null,
                  entry_date_to: null,
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
              fieldByHeader={{ Number: "document_number", Date: "entry_date", Status: "status" }}
              sortBy={sort_by}
              sortOrder={sort_order}
              onSort={setParams}
            />
          </TableRow>
        </TableHeader>
        <TableBody>
          {journalsQuery.isLoading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell colSpan={headers.length}>
                  <Skeleton className="h-6 w-full" />
                </TableCell>
              </TableRow>
            ))
          ) : journalsQuery.isError ? (
            <TableRow>
              <TableCell colSpan={headers.length}>
                <DataTableError
                  message={getErrorMessage(journalsQuery.error)}
                  onRetry={() => journalsQuery.refetch()}
                />
              </TableCell>
            </TableRow>
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={headers.length}>
                <DataTableEmpty
                  title="No journals"
                  message={emptyListMessage(canCreate, "Create a journal entry to get started.")}
                />
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-medium">
                  <RecordLink href={`/journals/${row.id}`}>{row.document_number}</RecordLink>
                </TableCell>
                <TableCell>
                  <RecordLink href={`/journals/${row.id}`}>{formatDate(row.entry_date)}</RecordLink>
                </TableCell>
                <TableCell>{JOURNAL_TYPE_LABELS[row.journal_type]}</TableCell>
                <TableCell>
                  <DocumentStatusBadge
                    status={row.status}
                    labels={JOURNAL_STATUS_LABELS}
                    variants={JOURNAL_STATUS_VARIANTS}
                  />
                </TableCell>
                <TableCell>{formatDecimal(row.total_debit_base)}</TableCell>
                <TableCell>{formatDecimal(row.total_credit_base)}</TableCell>
                {showActions ? (
                  <TableCell>
                    <DataTableRowActions
                      entityName={row.document_number}
                      viewHref={canRead ? `/journals/${row.id}` : undefined}
                      editHref={
                        canUpdate && row.status === "DRAFT" ? `/journals/${row.id}/edit` : undefined
                      }
                      onDelete={
                        canDelete && row.status === "DRAFT" ? () => setDeleting(row) : undefined
                      }
                    />
                  </TableCell>
                ) : null}
              </TableRow>
            ))
          )}
        </TableBody>
      </DataTable>
      <ConfirmActionDialog
        open={Boolean(deleting)}
        title="Delete journal"
        description={`${deleting?.document_number ?? "This journal"} will be removed. Only draft journals can be deleted.`}
        confirmLabel="Delete"
        pending={deleteJournal.isPending}
        onOpenChange={(open) => !open && setDeleting(null)}
        onConfirm={() => void confirmDelete()}
      />
    </ListPage>
  );
}
