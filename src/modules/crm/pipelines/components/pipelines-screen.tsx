"use client";

import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { PipelineFormDialog } from "@/modules/crm/pipelines/components/pipeline-form-dialog";
import { useDeletePipeline } from "@/modules/crm/pipelines/mutations";
import { pipelinePermissions } from "@/modules/crm/pipelines/permissions";
import { usePipelines } from "@/modules/crm/pipelines/queries";
import type { PipelineListItem } from "@/modules/crm/pipelines/schemas";
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
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { TableBody, TableCell, TableHeader, TableRow } from "@/shared/components/ui/table";
import { useTableParams } from "@/shared/hooks/use-table-params";

const SORT_FIELDS = [
  { value: "name", label: "Name" },
  { value: "is_default", label: "Default" },
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

export function PipelinesScreen() {
  const { canCreate, canRead, canUpdate, canDelete } = useCrudPermissions(pipelinePermissions);
  const { page, page_size, search, sort_by, sort_order, filters, setParams, setPage } =
    useTableParams();
  const pipelinesQuery = usePipelines({
    page,
    page_size,
    search,
    sort_by,
    sort_order,
    is_active: parseBoolFilter(filters.is_active),
  });
  const deletePipeline = useDeletePipeline();
  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState<PipelineListItem | null>(null);
  const showActions = hasRowActions(canRead, canUpdate, canDelete);

  const rows = pipelinesQuery.data?.data ?? [];
  const meta = pipelinesQuery.data?.meta;
  const userNameById = useUserNameMap();

  const columnDefs = useMemo((): Array<DataTableColumn<PipelineListItem>> => {
    return [
      {
        id: "name",
        header: "Name",
        sortableField: "name",
        className: "max-w-xs min-w-0 font-medium",
        cell: (row) => (
          <RecordLink href={`/pipelines/${row.id}`} className="block truncate">
            {row.name}
          </RecordLink>
        ),
      },
      {
        id: "is_default",
        header: "Default",
        sortableField: "is_default",
        cell: (row) =>
          row.is_default ? <Badge variant="secondary">Default</Badge> : <span>—</span>,
      },
      {
        id: "is_active",
        header: "Status",
        sortableField: "is_active",
        cell: (row) => <ActiveBadge active={row.is_active} />,
      },
      ...auditTimestampColumns<PipelineListItem>(),
      ...auditActorColumns<PipelineListItem>(userNameById),
      ...actionsColumn<PipelineListItem>(showActions, (row) => (
        <DataTableRowActions
          entityName={row.name}
          viewHref={canRead ? `/pipelines/${row.id}` : undefined}
          editHref={canUpdate ? `/pipelines/${row.id}/edit` : undefined}
          onDelete={canDelete && !row.is_default ? () => setDeleting(row) : undefined}
        />
      )),
    ];
  }, [canDelete, canRead, canUpdate, showActions, userNameById]);

  const { columns, columnsDialog, colSpan } = useTableColumns("crm.pipelines", columnDefs);

  async function confirmDelete() {
    if (!deleting) {
      return;
    }
    try {
      await deletePipeline.mutateAsync(deleting.id);
      toast.success("Pipeline deleted");
      setDeleting(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <ListPage>
      <PageHeader
        title="Pipelines"
        subtitle="Opportunity stages and win probabilities"
        actions={
          canCreate ? (
            <Button type="button" size="sm" onClick={() => setFormOpen(true)}>
              <Plus className="size-3.5" />
              New Pipeline
            </Button>
          ) : undefined
        }
      />
      <DataTableToolbar>
        <ListSearch
          value={search ?? ""}
          onChange={(value) => setParams({ search: value || null })}
          placeholder="Search name…"
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
          {pipelinesQuery.isLoading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell colSpan={colSpan}>
                  <Skeleton className="h-6 w-full" />
                </TableCell>
              </TableRow>
            ))
          ) : pipelinesQuery.isError ? (
            <TableRow>
              <TableCell colSpan={colSpan}>
                <DataTableError
                  message={getErrorMessage(pipelinesQuery.error)}
                  onRetry={() => pipelinesQuery.refetch()}
                />
              </TableCell>
            </TableRow>
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={colSpan}>
                <DataTableEmpty
                  title="No pipelines"
                  message={emptyListMessage(canCreate, "Create a pipeline to get started.")}
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
      <PipelineFormDialog open={formOpen} onOpenChange={setFormOpen} />
      <ConfirmActionDialog
        open={Boolean(deleting)}
        title="Delete pipeline"
        description={`Delete ${deleting ? `"${deleting.name}"` : "this pipeline"}? This cannot be undone.`}
        confirmLabel="Delete"
        pending={deletePipeline.isPending}
        onOpenChange={(open) => !open && setDeleting(null)}
        onConfirm={() => void confirmDelete()}
      />
    </ListPage>
  );
}
