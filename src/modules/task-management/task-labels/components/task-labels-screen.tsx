"use client";

import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { TaskLabelFormDialog } from "@/modules/task-management/task-labels/components/task-label-form-dialog";
import { useDeleteTaskLabel } from "@/modules/task-management/task-labels/mutations";
import { taskLabelPermissions } from "@/modules/task-management/task-labels/permissions";
import { useTaskLabels } from "@/modules/task-management/task-labels/queries";
import type { TaskLabel } from "@/modules/task-management/task-labels/schemas";
import { getErrorMessage } from "@/shared/api/errors";
import { emptyListMessage, useCrudPermissions } from "@/shared/auth/use-crud-permissions";
import { DataTableColumnHeads, DataTableCells } from "@/shared/components/data-table/column-cells";
import { actionsColumn, type DataTableColumn } from "@/shared/components/data-table/columns";
import { DataTable } from "@/shared/components/data-table/data-table";
import { ListSearch } from "@/shared/components/data-table/list-search";
import { DataTablePagination } from "@/shared/components/data-table/pagination";
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
  { value: "name", label: "Name" },
  { value: "color", label: "Color" },
] as const;

export function TaskLabelsScreen() {
  const { canCreate, canUpdate, canDelete } = useCrudPermissions(taskLabelPermissions);
  const { page, page_size, search, sort_by, sort_order, setParams, setPage } = useTableParams();
  const labelsQuery = useTaskLabels({ page, page_size, search, sort_by, sort_order });
  const deleteLabel = useDeleteTaskLabel();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<TaskLabel | null>(null);
  const [deleting, setDeleting] = useState<TaskLabel | null>(null);
  const showActions = hasRowActions(canUpdate, canDelete);

  const rows = labelsQuery.data?.data ?? [];
  const meta = labelsQuery.data?.meta;

  const columnDefs = useMemo((): Array<DataTableColumn<TaskLabel>> => {
    return [
      { id: "name", header: "Name", sortableField: "name", cell: (row) => row.name },
      { id: "color", header: "Color", sortableField: "color", cell: (row) => row.color },
      {
        id: "is_active",
        header: "Status",
        cell: (row) => <ActiveBadge active={row.is_active} />,
      },
      ...actionsColumn<TaskLabel>(showActions, (row) => (
        <DataTableRowActions
          entityName={row.name}
          onEdit={
            canUpdate
              ? () => {
                  setEditing(row);
                  setFormOpen(true);
                }
              : undefined
          }
          onDelete={canDelete ? () => setDeleting(row) : undefined}
        />
      )),
    ];
  }, [canDelete, canUpdate, showActions]);

  const { columns, columnsDialog, colSpan } = useTableColumns("tasks.labels", columnDefs);

  return (
    <ListPage>
      <PageHeader
        title="Task labels"
        subtitle="Labels used to categorize tasks."
        actions={
          canCreate ? (
            <Button
              type="button"
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              <Plus />
              New label
            </Button>
          ) : null
        }
      />
      <DataTableToolbar>
        <ListSearch
          value={search ?? ""}
          onChange={(value) => setParams({ search: value, page: 1 })}
        />
        <SortDialog
          fields={SORT_FIELDS}
          sortBy={sort_by}
          sortOrder={sort_order}
          onApply={(next) => setParams({ ...next, page: 1 })}
        />
        {columnsDialog}
      </DataTableToolbar>
      {labelsQuery.isLoading ? <Skeleton className="h-64 w-full" /> : null}
      {labelsQuery.isError ? (
        <DataTableError
          message={getErrorMessage(labelsQuery.error)}
          onRetry={() => labelsQuery.refetch()}
        />
      ) : null}
      {!labelsQuery.isLoading && !labelsQuery.isError ? (
        <DataTable
          footer={
            meta ? (
              <DataTablePagination
                meta={meta}
                onPageChange={setPage}
                onPageSizeChange={(next) => setParams({ page_size: next, page: 1 })}
              />
            ) : null
          }
        >
          <TableHeader>
            <DataTableColumnHeads columns={columns} sortBy={sort_by} sortOrder={sort_order} />
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={colSpan}>
                  <DataTableEmpty message={emptyListMessage(canCreate, "labels")} />
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.id}>
                  <DataTableCells row={row} columns={columns} />
                </TableRow>
              ))
            )}
          </TableBody>
        </DataTable>
      ) : null}
      <TaskLabelFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditing(null);
        }}
        label={editing}
      />
      <ConfirmActionDialog
        open={Boolean(deleting)}
        title="Delete label"
        description={`Delete ${deleting ? `"${deleting.name}"` : "this label"}?`}
        confirmLabel="Delete"
        pending={deleteLabel.isPending}
        onOpenChange={(open) => !open && setDeleting(null)}
        onConfirm={() => {
          if (!deleting) return;
          void deleteLabel
            .mutateAsync(deleting.id)
            .then(() => {
              toast.success("Label deleted");
              setDeleting(null);
            })
            .catch((error) => toast.error(getErrorMessage(error)));
        }}
      />
    </ListPage>
  );
}
