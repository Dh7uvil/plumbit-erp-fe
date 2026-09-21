"use client";

import { Check, Plus } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

import { ActivityFormDialog } from "@/modules/crm/activities/components/activity-form-dialog";
import { ActivityStatusBadge } from "@/modules/crm/activities/components/activity-status-badge";
import { useCompleteActivity, useDeleteActivity } from "@/modules/crm/activities/mutations";
import { activityPermissions } from "@/modules/crm/activities/permissions";
import { useActivities } from "@/modules/crm/activities/queries";
import {
  ACTIVITY_STATUSES,
  ACTIVITY_STATUS_LABELS,
  ACTIVITY_TYPES,
  ACTIVITY_TYPE_LABELS,
  CRM_RELATED_ENTITY_LABELS,
  relatedEntityHref,
  thisWeekRange,
  type Activity,
  type ActivityStatus,
  type ActivityType,
} from "@/modules/crm/activities/schemas";
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
import { FilterField, MoreFiltersDialog } from "@/shared/components/data-table/more-filters-dialog";
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
import { ListPage } from "@/shared/components/layout/list-page";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Button } from "@/shared/components/ui/button";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { TableBody, TableCell, TableHeader, TableRow } from "@/shared/components/ui/table";
import { useTableParams } from "@/shared/hooks/use-table-params";
import { formatDateTime } from "@/shared/lib/format";

const SORT_FIELDS = [
  { value: "due_at", label: "Due" },
  { value: "subject", label: "Subject" },
  { value: "status", label: "Status" },
  { value: "priority", label: "Priority" },
  { value: "created_at", label: "Created" },
] as const;
const ALL = "all";
const VIEWS = [
  { value: "all", label: "All" },
  { value: "mine", label: "My open" },
  { value: "overdue", label: "Overdue" },
  { value: "week", label: "This week" },
] as const;

export function ActivitiesScreen() {
  const { canCreate, canUpdate, canDelete } = useCrudPermissions(activityPermissions);
  const { page, page_size, search, sort_by, sort_order, filters, setParams, setPage } =
    useTableParams();
  const statusFilter = filters.status;
  const typeFilter = filters.activity_type;
  const view = filters.view ?? "all";
  const week = view === "week" ? thisWeekRange() : null;
  const activitiesQuery = useActivities({
    page,
    page_size,
    search,
    sort_by: sort_by ?? "due_at",
    sort_order: sort_order ?? "asc",
    status:
      statusFilter && statusFilter !== ALL
        ? (statusFilter as ActivityStatus)
        : view === "mine"
          ? "OPEN"
          : undefined,
    activity_type: typeFilter && typeFilter !== ALL ? (typeFilter as ActivityType) : undefined,
    mine: view === "mine" ? true : undefined,
    overdue: view === "overdue" ? true : undefined,
    due_from: week?.due_from,
    due_to: week?.due_to,
  });
  const completeActivity = useCompleteActivity();
  const deleteActivity = useDeleteActivity();
  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState<Activity | null>(null);
  const [draftType, setDraftType] = useState(ALL);
  const showActions = hasRowActions(canUpdate, canDelete);
  const userNameById = useUserNameMap();
  const extraType = typeFilter && typeFilter !== ALL ? typeFilter : null;
  const extraCount = extraType ? 1 : 0;

  const rows = activitiesQuery.data?.data ?? [];
  const meta = activitiesQuery.data?.meta;

  const onComplete = useCallback(
    async (row: Activity) => {
      try {
        await completeActivity.mutateAsync({ id: row.id });
        toast.success("Activity completed");
      } catch (error) {
        toast.error(getErrorMessage(error));
      }
    },
    [completeActivity],
  );

  const columnDefs = useMemo((): Array<DataTableColumn<Activity>> => {
    return [
      {
        id: "subject",
        header: "Subject",
        sortableField: "subject",
        className: "max-w-xs min-w-0 font-medium",
        cell: (row) => row.subject,
      },
      {
        id: "activity_type",
        header: "Type",
        sortableField: "activity_type",
        cell: (row) => ACTIVITY_TYPE_LABELS[row.activity_type],
      },
      {
        id: "status",
        header: "Status",
        sortableField: "status",
        cell: (row) => <ActivityStatusBadge status={row.status} />,
      },
      {
        id: "due_at",
        header: "Due",
        sortableField: "due_at",
        cell: (row) => formatDateTime(row.due_at),
      },
      {
        id: "related",
        header: "Related",
        cell: (row) => (
          <RecordLink href={relatedEntityHref(row.related_entity_type, row.related_entity_id)}>
            {CRM_RELATED_ENTITY_LABELS[row.related_entity_type]}
          </RecordLink>
        ),
      },
      {
        id: "owner_id",
        header: "Owner",
        cell: (row) => (row.owner_id ? (userNameById.get(row.owner_id) ?? "—") : "—"),
      },
      ...auditTimestampColumns<Activity>(),
      ...auditActorColumns<Activity>(userNameById),
      ...actionsColumn<Activity>(showActions, (row) => (
        <DataTableRowActions
          entityName={row.subject}
          onDelete={
            canDelete && row.available_actions.includes("delete")
              ? () => setDeleting(row)
              : undefined
          }
          extra={
            canUpdate && row.available_actions.includes("complete") ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                aria-label={`Complete ${row.subject}`}
                disabled={completeActivity.isPending}
                onClick={() => void onComplete(row)}
              >
                <Check className="size-3.5" />
                Complete
              </Button>
            ) : null
          }
        />
      )),
    ];
  }, [canDelete, canUpdate, completeActivity.isPending, onComplete, showActions, userNameById]);

  const { columns, columnsDialog, colSpan } = useTableColumns("crm.activities", columnDefs);

  async function confirmDelete() {
    if (!deleting) {
      return;
    }
    try {
      await deleteActivity.mutateAsync(deleting.id);
      toast.success("Activity deleted");
      setDeleting(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <ListPage>
      <PageHeader
        title="Activities"
        subtitle="Tasks, calls, and meetings across the pipeline"
        actions={
          canCreate ? (
            <Button type="button" size="sm" onClick={() => setFormOpen(true)}>
              <Plus className="size-3.5" />
              New activity
            </Button>
          ) : undefined
        }
      />
      <DataTableToolbar>
        <ListSearch
          value={search ?? ""}
          onChange={(value) => setParams({ search: value || null })}
          placeholder="Search subject…"
        />
        <FilterSelect
          label="Status"
          className="w-40"
          placeholder="Status"
          value={statusFilter ?? ALL}
          onValueChange={(value) =>
            setParams({ filters: { status: value === ALL ? null : value }, page: 1 })
          }
          options={[
            { value: ALL, label: "All statuses" },
            ...ACTIVITY_STATUSES.map((status) => ({
              value: status,
              label: ACTIVITY_STATUS_LABELS[status],
            })),
          ]}
        />
        <FilterSelect
          label="View"
          className="w-40"
          placeholder="View"
          value={view}
          onValueChange={(value) =>
            setParams({ filters: { view: value === "all" ? null : value }, page: 1 })
          }
          options={[...VIEWS]}
        />
        <MoreFiltersDialog
          extraCount={extraCount}
          draftCount={draftType !== ALL ? 1 : 0}
          description="Filter by activity type."
          onOpen={() => setDraftType(extraType ?? ALL)}
          onApply={() =>
            setParams({ filters: { activity_type: draftType === ALL ? null : draftType } })
          }
          onClearDraft={() => setDraftType(ALL)}
        >
          <FilterField label="Type" htmlFor="activity-filter-type">
            <FilterSelect
              id="activity-filter-type"
              className="w-full"
              placeholder="Type"
              value={draftType}
              onValueChange={setDraftType}
              options={[
                { value: ALL, label: "All types" },
                ...ACTIVITY_TYPES.map((type) => ({
                  value: type,
                  label: ACTIVITY_TYPE_LABELS[type],
                })),
              ]}
            />
          </FilterField>
        </MoreFiltersDialog>
        <SortDialog
          fields={[...SORT_FIELDS]}
          sortBy={sort_by ?? "due_at"}
          sortOrder={sort_order ?? "asc"}
          onApply={setParams}
        />
        {columnsDialog}
      </DataTableToolbar>
      <DataTable footer={meta ? <DataTablePagination meta={meta} onPageChange={setPage} /> : null}>
        <TableHeader>
          <TableRow>
            <DataTableColumnHeads
              columns={columns}
              sortBy={sort_by ?? "due_at"}
              sortOrder={sort_order ?? "asc"}
              onSort={setParams}
            />
          </TableRow>
        </TableHeader>
        <TableBody>
          {activitiesQuery.isLoading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell colSpan={colSpan}>
                  <Skeleton className="h-6 w-full" />
                </TableCell>
              </TableRow>
            ))
          ) : activitiesQuery.isError ? (
            <TableRow>
              <TableCell colSpan={colSpan}>
                <DataTableError
                  message={getErrorMessage(activitiesQuery.error)}
                  onRetry={() => activitiesQuery.refetch()}
                />
              </TableCell>
            </TableRow>
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={colSpan}>
                <DataTableEmpty
                  title="No activities"
                  message={emptyListMessage(canCreate, "Create an activity to get started.")}
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
      <ActivityFormDialog open={formOpen} onOpenChange={setFormOpen} />
      <ConfirmActionDialog
        open={Boolean(deleting)}
        title="Delete activity"
        description={deleting ? `Delete ${deleting.subject}? This cannot be undone.` : undefined}
        confirmLabel="Delete"
        pending={deleteActivity.isPending}
        onOpenChange={(open) => !open && setDeleting(null)}
        onConfirm={() => void confirmDelete()}
      />
    </ListPage>
  );
}
