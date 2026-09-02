"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { DocumentSequenceFormDialog } from "@/modules/erp/accounting/document-sequences/components/document-sequence-form-dialog";
import { useDeleteDocumentSequence } from "@/modules/erp/accounting/document-sequences/mutations";
import { documentSequencePermissions } from "@/modules/erp/accounting/document-sequences/permissions";
import { useDocumentSequences } from "@/modules/erp/accounting/document-sequences/queries";
import {
  documentTypeLabel,
  type DocumentSequence,
} from "@/modules/erp/accounting/document-sequences/schemas";
import { getErrorMessage } from "@/shared/api/errors";
import { emptyListMessage, useCrudPermissions } from "@/shared/auth/use-crud-permissions";
import { DataTable } from "@/shared/components/data-table/data-table";
import { FilterSelect } from "@/shared/components/data-table/filter-select";
import { ListSearch } from "@/shared/components/data-table/list-search";
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
import { ConfirmActionDialog } from "@/shared/components/feedback/confirm-action-dialog";
import { ActiveBadge } from "@/shared/components/feedback/active-badge";
import { ListPage } from "@/shared/components/layout/list-page";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Button } from "@/shared/components/ui/button";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { TableBody, TableCell, TableHeader, TableRow } from "@/shared/components/ui/table";
import { useTableParams } from "@/shared/hooks/use-table-params";

const COLUMN_HEADERS = ["Type", "Series", "Year", "Prefix", "Next", "Padding", "Status"] as const;
const SORT_FIELDS = [
  { value: "document_type", label: "Type" },
  { value: "series", label: "Series" },
  { value: "fiscal_year", label: "Year" },
  { value: "next_number", label: "Next" },
  { value: "is_active", label: "Status" },
] as const;
const SORT_FIELD_BY_HEADER: Partial<Record<string, string>> = {
  Type: "document_type",
  Series: "series",
  Year: "fiscal_year",
  Next: "next_number",
  Status: "is_active",
};
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
  const headers = tableHeaders(COLUMN_HEADERS, showActions);

  const rows = documentSequencesQuery.data?.data ?? [];
  const meta = documentSequencesQuery.data?.meta;

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
          placeholder="Search document sequences…"
        />
        <FilterSelect
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
            <SortableHeads
              headers={headers}
              fieldByHeader={SORT_FIELD_BY_HEADER}
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
                <TableCell colSpan={headers.length}>
                  <Skeleton className="h-6 w-full" />
                </TableCell>
              </TableRow>
            ))
          ) : documentSequencesQuery.isError ? (
            <TableRow>
              <TableCell colSpan={headers.length}>
                <DataTableError
                  message={getErrorMessage(documentSequencesQuery.error)}
                  onRetry={() => documentSequencesQuery.refetch()}
                />
              </TableCell>
            </TableRow>
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={headers.length}>
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
                <TableCell>
                  <RecordLink href={`/document-sequences/${sequence.id}`}>
                    {documentTypeLabel(sequence.document_type)}
                  </RecordLink>
                </TableCell>
                <TableCell className="font-medium">
                  <RecordLink href={`/document-sequences/${sequence.id}`}>
                    {sequence.series}
                  </RecordLink>
                </TableCell>
                <TableCell>{sequence.fiscal_year}</TableCell>
                <TableCell className="font-mono text-sm">{sequence.prefix}</TableCell>
                <TableCell>{sequence.next_number}</TableCell>
                <TableCell>{sequence.padding}</TableCell>
                <TableCell>
                  <ActiveBadge active={sequence.is_active} />
                </TableCell>
                {showActions ? (
                  <TableCell>
                    <DataTableRowActions
                      entityName={`${sequence.series} ${sequence.fiscal_year}`}
                      viewHref={canRead ? `/document-sequences/${sequence.id}` : undefined}
                      editHref={canUpdate ? `/document-sequences/${sequence.id}/edit` : undefined}
                      onDelete={canDelete ? () => setDeleting(sequence) : undefined}
                    />
                  </TableCell>
                ) : null}
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
