"use client";

import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { DocumentSequenceFormDialog } from "@/modules/erp/accounting/document-sequences/components/document-sequence-form-dialog";
import { useDeleteDocumentSequence } from "@/modules/erp/accounting/document-sequences/mutations";
import { documentSequencePermissions } from "@/modules/erp/accounting/document-sequences/permissions";
import { useDocumentSequences } from "@/modules/erp/accounting/document-sequences/queries";
import {
  documentTypeLabel,
  formatSequencePreview,
  type DocumentSequence,
} from "@/modules/erp/accounting/document-sequences/schemas";
import { getErrorMessage } from "@/shared/api/errors";
import { emptyListMessage, useCrudPermissions } from "@/shared/auth/use-crud-permissions";
import { DataTableColumnHeads, DataTableCells } from "@/shared/components/data-table/column-cells";
import {
  auditActorColumns,
  auditTimestampColumns,
  useUserNameMap,
} from "@/shared/components/data-table/audit-columns";
import { actionsColumn, type DataTableColumn } from "@/shared/components/data-table/columns";
import { DataTable } from "@/shared/components/data-table/data-table";
import { FilterSelect } from "@/shared/components/data-table/filter-select";
import { ListSearch } from "@/shared/components/data-table/list-search";
import { DataTablePagination } from "@/shared/components/data-table/pagination";
import { RecordLink } from "@/shared/components/data-table/record-link";
import { DataTableRowActions, hasRowActions } from "@/shared/components/data-table/row-actions";
import { SortDialog } from "@/shared/components/data-table/sort-dialog";
import { DataTableEmpty, DataTableError } from "@/shared/components/data-table/states";
import { DataTableToolbar } from "@/shared/components/data-table/toolbar";
import { useTableColumns } from "@/shared/components/data-table/use-table-columns";
import { ConfirmActionDialog } from "@/shared/components/feedback/confirm-action-dialog";
import { ActiveBadge } from "@/shared/components/feedback/active-badge";
import { ListPage } from "@/shared/components/layout/list-page";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Button } from "@/shared/components/ui/button";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { TableBody, TableCell, TableHeader, TableRow } from "@/shared/components/ui/table";
import { useTableParams } from "@/shared/hooks/use-table-params";

const SORT_FIELDS = [
  { value: "document_type", label: "Type" },
  { value: "series", label: "Series" },
  { value: "fiscal_year", label: "Year" },
  { value: "next_number", label: "Next" },
  { value: "is_active", label: "Status" },
] as const;
const ALL = "all";

function parseBoolFilter(value: string | undefined): boolean | undefined {
  if (value === "true") {
    return true;
  }
  if (value === "false") {
    return false;
  }
  return undefined;
}

function formatSequencePreviewRow(sequence: DocumentSequence) {
  return formatSequencePreview(
    sequence.prefix,
    sequence.fiscal_year,
    sequence.next_number,
    sequence.padding,
    sequence.document_type,
  );
}

export function DocumentSequencesScreen() {
  const { canCreate, canRead, canUpdate, canDelete } = useCrudPermissions(
    documentSequencePermissions,
  );
  const { page, page_size, search, sort_by, sort_order, filters, setParams, setPage } =
    useTableParams();
  const documentSequencesQuery = useDocumentSequences({
    page,
    page_size,
    search,
    sort_by,
    sort_order,
    is_active: parseBoolFilter(filters.is_active),
  });
  const deleteDocumentSequence = useDeleteDocumentSequence();
  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState<DocumentSequence | null>(null);
  const showActions = hasRowActions(canRead, canUpdate, canDelete);

  const rows = documentSequencesQuery.data?.data ?? [];
  const meta = documentSequencesQuery.data?.meta;
  const userNameById = useUserNameMap();

  const columnDefs = useMemo((): Array<DataTableColumn<DocumentSequence>> => {
    return [
      {
        id: "document_type",
        header: "Type",
        sortableField: "document_type",
        cell: (sequence) => (
          <RecordLink href={`/document-sequences/${sequence.id}`}>
            {documentTypeLabel(sequence.document_type)}
          </RecordLink>
        ),
      },
      {
        id: "series",
        header: "Series",
        sortableField: "series",
        className: "font-medium",
        cell: (sequence) => (
          <RecordLink href={`/document-sequences/${sequence.id}`}>{sequence.series}</RecordLink>
        ),
      },
      {
        id: "fiscal_year",
        header: "Year",
        sortableField: "fiscal_year",
        cell: (sequence) => sequence.fiscal_year,
      },
      {
        id: "prefix",
        header: "Prefix",
        className: "font-mono text-sm",
        cell: (sequence) => sequence.prefix,
      },
      {
        id: "next_number",
        header: "Next",
        sortableField: "next_number",
        cell: (sequence) => (
          <span className="font-mono text-sm">{formatSequencePreviewRow(sequence)}</span>
        ),
      },
      {
        id: "padding",
        header: "Padding",
        cell: (sequence) => sequence.padding,
      },
      {
        id: "is_active",
        header: "Status",
        sortableField: "is_active",
        cell: (sequence) => <ActiveBadge active={sequence.is_active} />,
      },
      ...auditTimestampColumns<DocumentSequence>(),
      ...auditActorColumns<DocumentSequence>(userNameById),
      ...actionsColumn<DocumentSequence>(showActions, (sequence) => (
        <DataTableRowActions
          entityName={`${sequence.series} ${sequence.fiscal_year}`}
          viewHref={canRead ? `/document-sequences/${sequence.id}` : undefined}
          editHref={canUpdate ? `/document-sequences/${sequence.id}/edit` : undefined}
          onDelete={canDelete ? () => setDeleting(sequence) : undefined}
        />
      )),
    ];
  }, [canDelete, canRead, canUpdate, showActions, userNameById]);

  const { columns, columnsDialog, colSpan } = useTableColumns("erp.document_sequences", columnDefs);

  function openCreate() {
    setFormOpen(true);
  }

  async function confirmDelete() {
    if (!deleting) {
      return;
    }
    try {
      await deleteDocumentSequence.mutateAsync(deleting.id);
      toast.success("Document sequence deleted");
      setDeleting(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <ListPage>
      <PageHeader
        title="Document sequences"
        subtitle="Locked counters for document numbers"
        actions={
          canCreate ? (
            <Button type="button" size="sm" onClick={openCreate}>
              <Plus className="size-3.5" />
              New Document Sequence
            </Button>
          ) : undefined
        }
      />
      <DataTableToolbar>
        <ListSearch
          value={search ?? ""}
          onChange={(value) => setParams({ search: value || null })}
          placeholder="Search series, prefix, type…"
        />
        <FilterSelect
          label="Status"
          className="w-36"
          placeholder="Status"
          value={filters.is_active ?? ALL}
          onValueChange={(value) =>
            setParams({ filters: { is_active: value === ALL ? null : value } })
          }
          options={[
            { value: ALL, label: "All statuses" },
            { value: "true", label: "Active" },
            { value: "false", label: "Inactive" },
          ]}
        />
        <SortDialog
          fields={[...SORT_FIELDS]}
          sortBy={sort_by}
          sortOrder={sort_order}
          onApply={setParams}
        />
        {columnsDialog}
        {search || filters.is_active || sort_by ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() =>
              setParams({
                search: null,
                sort_by: null,
                sort_order: null,
                filters: { is_active: null },
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
          {documentSequencesQuery.isLoading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell colSpan={colSpan}>
                  <Skeleton className="h-6 w-full" />
                </TableCell>
              </TableRow>
            ))
          ) : documentSequencesQuery.isError ? (
            <TableRow>
              <TableCell colSpan={colSpan}>
                <DataTableError
                  message={getErrorMessage(documentSequencesQuery.error)}
                  onRetry={() => documentSequencesQuery.refetch()}
                />
              </TableCell>
            </TableRow>
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={colSpan}>
                <DataTableEmpty
                  title="No document sequences"
                  message={emptyListMessage(
                    canCreate,
                    "Create a document sequence to get started.",
                  )}
                />
              </TableCell>
            </TableRow>
          ) : (
            rows.map((sequence) => (
              <TableRow key={sequence.id}>
                <DataTableCells columns={columns} row={sequence} />
              </TableRow>
            ))
          )}
        </TableBody>
      </DataTable>
      <DocumentSequenceFormDialog open={formOpen} onOpenChange={setFormOpen} />
      <ConfirmActionDialog
        open={Boolean(deleting)}
        title="Delete document sequence"
        description={`Delete ${deleting ? `"${deleting.series}" (${deleting.fiscal_year})` : "this document sequence"}? This cannot be undone.`}
        confirmLabel="Delete"
        pending={deleteDocumentSequence.isPending}
        onOpenChange={(open) => !open && setDeleting(null)}
        onConfirm={() => void confirmDelete()}
      />
    </ListPage>
  );
}
