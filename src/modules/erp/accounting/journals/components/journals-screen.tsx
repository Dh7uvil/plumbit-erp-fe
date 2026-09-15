"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
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
import { useAllCurrencies } from "@/modules/erp/currencies/queries";
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
import { MoreFiltersDialog } from "@/shared/components/data-table/more-filters-dialog";
import { DataTablePagination } from "@/shared/components/data-table/pagination";
import { RecordLink } from "@/shared/components/data-table/record-link";
import { DataTableRowActions, hasRowActions } from "@/shared/components/data-table/row-actions";
import { SortDialog } from "@/shared/components/data-table/sort-dialog";
import { DataTableEmpty, DataTableError } from "@/shared/components/data-table/states";
import { DataTableToolbar } from "@/shared/components/data-table/toolbar";
import { useTableColumns } from "@/shared/components/data-table/use-table-columns";
import { DocumentStatusBadge } from "@/shared/components/document/document-status-badge";
import { ConfirmActionDialog } from "@/shared/components/feedback/confirm-action-dialog";
import { ListPage } from "@/shared/components/layout/list-page";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Button } from "@/shared/components/ui/button";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { TableBody, TableCell, TableHeader, TableRow } from "@/shared/components/ui/table";
import { useTableParams } from "@/shared/hooks/use-table-params";
import { formatDate, formatDateTime, formatReportMoney } from "@/shared/lib/format";
import { documentTypeDisplayLabel } from "@/shared/components/document/document-links";
import { useCurrentTenant } from "@/modules/users-management/tenants/queries";
import { useAllBranches } from "@/modules/users-management/branches/queries";

const SORT_FIELDS = [
  { value: "document_number", label: "Number" },
  { value: "entry_date", label: "Date" },
  { value: "status", label: "Status" },
] as const;
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
  const tenantQuery = useCurrentTenant();
  const currencyCode = tenantQuery.data?.default_currency;
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
  const currenciesQuery = useAllCurrencies();
  const branchesQuery = useAllBranches();
  const deleteJournal = useDeleteJournal();
  const [deleting, setDeleting] = useState<JournalEntry | null>(null);
  const showActions = hasRowActions(canRead, canUpdate, canDelete);
  const rows = journalsQuery.data?.data ?? [];
  const meta = journalsQuery.data?.meta;
  const userNameById = useUserNameMap();
  const currencyCodeById = useMemo(
    () => new Map((currenciesQuery.data ?? []).map((currency) => [currency.id, currency.code])),
    [currenciesQuery.data],
  );
  const branchNameById = useMemo(
    () => new Map((branchesQuery.data ?? []).map((branch) => [branch.id, branch.name])),
    [branchesQuery.data],
  );

  const columnDefs = useMemo((): Array<DataTableColumn<JournalEntry>> => {
    return [
      {
        id: "document_number",
        header: "Number",
        sortableField: "document_number",
        className: "font-medium",
        cell: (row) => (
          <RecordLink href={`/journals/${row.id}`}>{row.document_number}</RecordLink>
        ),
      },
      {
        id: "narration",
        header: "Narration",
        className: "max-w-[24ch] truncate",
        cell: (row) => row.narration ?? "—",
      },
      {
        id: "entry_date",
        header: "Date",
        sortableField: "entry_date",
        cell: (row) => (
          <RecordLink href={`/journals/${row.id}`}>{formatDate(row.entry_date)}</RecordLink>
        ),
      },
      {
        id: "journal_type",
        header: "Type",
        cell: (row) => JOURNAL_TYPE_LABELS[row.journal_type],
      },
      {
        id: "source",
        header: "Source",
        cell: (row) => (row.source_type ? documentTypeDisplayLabel(row.source_type) : "—"),
      },
      {
        id: "status",
        header: "Status",
        sortableField: "status",
        cell: (row) => (
          <DocumentStatusBadge
            status={row.status}
            labels={JOURNAL_STATUS_LABELS}
            variants={JOURNAL_STATUS_VARIANTS}
          />
        ),
      },
      {
        id: "debit",
        header: "Debit",
        className: "text-right",
        headerClassName: "text-right",
        cell: (row) => formatReportMoney(row.total_debit_base, currencyCode),
      },
      {
        id: "credit",
        header: "Credit",
        className: "text-right",
        headerClassName: "text-right",
        cell: (row) => formatReportMoney(row.total_credit_base, currencyCode),
      },
      {
        id: "is_posted",
        header: "Posted",
        defaultVisible: false,
        cell: (row) => (row.is_posted ? "Posted" : "Draft"),
      },
      {
        id: "currency",
        header: "Currency",
        defaultVisible: false,
        cell: (row) => currencyCodeById.get(row.currency_id) ?? "—",
      },
      {
        id: "branch",
        header: "Branch",
        defaultVisible: false,
        cell: (row) => (row.branch_id ? (branchNameById.get(row.branch_id) ?? "—") : "—"),
      },
      {
        id: "exchange_rate",
        header: "Exchange rate",
        defaultVisible: false,
        className: "tabular-nums",
        cell: (row) => row.exchange_rate,
      },
      {
        id: "reference",
        header: "Reference",
        defaultVisible: false,
        cell: (row) => row.reference || "—",
      },
      {
        id: "posted_at",
        header: "Posted at",
        defaultVisible: false,
        className: "text-muted-foreground text-xs",
        cell: (row) => formatDateTime(row.posted_at),
      },
      ...auditTimestampColumns<JournalEntry>(),
      ...auditActorColumns<JournalEntry>(userNameById),
      ...actionsColumn<JournalEntry>(showActions, (row) => (
        <DataTableRowActions
          entityName={row.document_number}
          viewHref={canRead ? `/journals/${row.id}` : undefined}
          editHref={canUpdate && row.status === "DRAFT" ? `/journals/${row.id}/edit` : undefined}
          onDelete={canDelete && row.status === "DRAFT" ? () => setDeleting(row) : undefined}
        />
      )),
    ];
  }, [
    branchNameById,
    canDelete,
    canRead,
    canUpdate,
    currencyCode,
    currencyCodeById,
    showActions,
    userNameById,
  ]);

  const { columns, columnsDialog, colSpan } = useTableColumns("erp.journals", columnDefs);

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
        subtitle="Manual and system journals posted through the ledger"
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
          placeholder="Search number, account, party, notes…"
        />
        <FilterSelect
          label="Status"
          className="w-36"
          placeholder="Status"
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
          label="Type"
          className="w-44"
          placeholder="Type"
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
          fields={[...SORT_FIELDS]}
          sortBy={sort_by}
          sortOrder={sort_order}
          onApply={setParams}
        />
        {columnsDialog}
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
            <DataTableColumnHeads
              columns={columns}
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
                <TableCell colSpan={colSpan}>
                  <Skeleton className="h-6 w-full" />
                </TableCell>
              </TableRow>
            ))
          ) : journalsQuery.isError ? (
            <TableRow>
              <TableCell colSpan={colSpan}>
                <DataTableError
                  message={getErrorMessage(journalsQuery.error)}
                  onRetry={() => journalsQuery.refetch()}
                />
              </TableCell>
            </TableRow>
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={colSpan}>
                <DataTableEmpty
                  title="No journals"
                  message={emptyListMessage(canCreate, "Create a journal entry to get started.")}
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
