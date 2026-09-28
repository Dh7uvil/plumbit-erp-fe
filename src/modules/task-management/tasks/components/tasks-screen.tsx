"use client";

import { LayoutGrid, Plus, Table2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { useMe } from "@/modules/users-management/auth/queries";
import { useTaskBoardColumns } from "@/modules/task-management/tasks/board-columns";
import { TaskAssigneeFilter } from "@/modules/task-management/tasks/components/task-assignee-filter";
import { TaskBoard } from "@/modules/task-management/tasks/components/task-board";
import {
  SWIMLANE_MODE_LABELS,
  SWIMLANE_MODES,
  parseSwimlaneMode,
} from "@/modules/task-management/tasks/swimlanes";
import { TaskDetailSheet } from "@/modules/task-management/tasks/components/task-detail-sheet";
import { TaskFormDialog } from "@/modules/task-management/tasks/components/task-form-dialog";
import { TaskStatusBadge } from "@/modules/task-management/tasks/components/task-status-badge";
import { useAssignTask, useDeleteTask } from "@/modules/task-management/tasks/mutations";
import { taskPermissions } from "@/modules/task-management/tasks/permissions";
import { useTasks } from "@/modules/task-management/tasks/queries";
import {
  TASK_PRIORITIES,
  TASK_PRIORITY_LABELS,
  TASK_STATUSES,
  TASK_STATUS_LABELS,
  TASK_TYPES,
  TASK_TYPE_LABELS,
  parseEnumList,
  parseIdList,
  relatedEntityHref,
  serializeEnumList,
  serializeIdList,
  thisWeekRange,
  type Task,
  type TaskListParams,
  type TaskPriority,
  type TaskStatus,
  type TaskType,
} from "@/modules/task-management/tasks/schemas";
import { useAllTaskLabels } from "@/modules/task-management/task-labels/queries";
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
import {
  ActiveFilterBar,
  FilterChip,
} from "@/shared/components/data-table/filter-chip";
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
import { Label } from "@/shared/components/ui/label";
import { MultiSelect } from "@/shared/components/ui/multi-select";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { TableBody, TableCell, TableHeader, TableRow } from "@/shared/components/ui/table";
import { useTableParams } from "@/shared/hooks/use-table-params";
import { formatDateTime } from "@/shared/lib/format";

const SORT_FIELDS = [
  { value: "due_at", label: "Due" },
  { value: "title", label: "Title" },
  { value: "status", label: "Status" },
  { value: "priority", label: "Priority" },
  { value: "task_number", label: "Number" },
  { value: "created_at", label: "Created" },
] as const;

const toolbarLabelClass = "text-muted-foreground mb-1 block text-xs font-medium";

export function TasksScreen() {
  const { canCreate, canRead, canUpdate, canDelete } = useCrudPermissions(taskPermissions);
  const { data: me } = useMe();
  const assignTask = useAssignTask();
  const { page, page_size, search, sort_by, sort_order, filters, setParams, setPage } =
    useTableParams();
  const boardView = filters.view === "board";
  const swimlaneMode = boardView ? parseSwimlaneMode(filters.swimlane) : null;
  const { statuses: boardStatuses, picker: lanePicker } = useTaskBoardColumns();

  const assigneeIds = parseIdList(filters.assignee_ids);
  const labelIds = parseIdList(filters.label_ids);
  const taskTypes = parseEnumList<TaskType>(filters.task_types);
  const priorities = parseEnumList<TaskPriority>(filters.priorities);
  const statuses = parseEnumList<TaskStatus>(filters.statuses);
  const mine = filters.mine === "1";
  const overdue = filters.overdue === "1";
  const dueThisWeek = filters.due_this_week === "1";
  const showSubtasksOnBoard = boardView && filters.subtasks === "1";
  const week = dueThisWeek ? thisWeekRange() : null;
  const sheetTaskId = filters.task ?? null;

  const sharedFilters: TaskListParams = {
    search,
    assignee_ids: assigneeIds.length > 0 ? assigneeIds : undefined,
    unassigned: filters.unassigned === "1" ? true : undefined,
    mine: mine || undefined,
    overdue: overdue || undefined,
    due_from: week?.due_from,
    due_to: week?.due_to,
    label_ids: labelIds.length > 0 ? labelIds : undefined,
    task_types: taskTypes.length > 0 ? taskTypes : undefined,
    priorities: priorities.length > 0 ? priorities : undefined,
    top_level_only: boardView && !showSubtasksOnBoard ? true : undefined,
  };

  const listParams: TaskListParams = {
    ...sharedFilters,
    page,
    page_size,
    sort_by: sort_by ?? "due_at",
    sort_order: sort_order ?? "asc",
    statuses: statuses.length > 0 ? statuses : undefined,
  };

  const tasksQuery = useTasks(boardView ? { ...sharedFilters, page: 1, page_size: 1 } : listParams);
  const deleteTask = useDeleteTask();
  const labelsQuery = useAllTaskLabels();
  const [formOpen, setFormOpen] = useState(false);
  const [boardCreateStatus, setBoardCreateStatus] = useState<TaskStatus | null>(null);
  const [deleting, setDeleting] = useState<Task | null>(null);
  const showActions = hasRowActions(canRead, canUpdate, canDelete);
  const userNameById = useUserNameMap();
  const rows = tasksQuery.data?.data ?? [];
  const meta = tasksQuery.data?.meta;

  const hasActiveFilters =
    mine ||
    overdue ||
    dueThisWeek ||
    assigneeIds.length > 0 ||
    labelIds.length > 0 ||
    taskTypes.length > 0 ||
    priorities.length > 0 ||
    statuses.length > 0 ||
    filters.unassigned === "1" ||
    Boolean(search) ||
    showSubtasksOnBoard ||
    Boolean(swimlaneMode);

  const columnDefs = useMemo((): Array<DataTableColumn<Task>> => {
    return [
      {
        id: "task_number",
        header: "Number",
        sortableField: "task_number",
        className: "font-mono text-xs",
        cell: (row) => (
          <RecordLink href={`/tasks/${row.id}`} className="block truncate">
            {row.task_number}
          </RecordLink>
        ),
      },
      {
        id: "title",
        header: "Title",
        sortableField: "title",
        cell: (row) => (
          <RecordLink href={`/tasks/${row.id}`} className="block truncate font-medium">
            {row.title}
          </RecordLink>
        ),
      },
      {
        id: "status",
        header: "Status",
        sortableField: "status",
        cell: (row) => <TaskStatusBadge status={row.status} />,
      },
      {
        id: "priority",
        header: "Priority",
        sortableField: "priority",
        cell: (row) => TASK_PRIORITY_LABELS[row.priority],
      },
      {
        id: "due_at",
        header: "Due",
        sortableField: "due_at",
        cell: (row) => (row.due_at ? formatDateTime(row.due_at) : "—"),
      },
      {
        id: "assignee_id",
        header: "Assignee",
        cell: (row) => (row.assignee_id ? (userNameById.get(row.assignee_id) ?? "—") : "—"),
      },
      {
        id: "related",
        header: "Related",
        cell: (row) =>
          row.related_entity_type && row.related_entity_id ? (
            <RecordLink href={relatedEntityHref(row.related_entity_type, row.related_entity_id)}>
              {row.related_entity_type}
            </RecordLink>
          ) : (
            "—"
          ),
      },
      ...auditActorColumns<Task>(userNameById),
      ...auditTimestampColumns<Task>(),
      ...actionsColumn<Task>(showActions, (row) => (
        <DataTableRowActions
          entityName={row.title}
          viewHref={canRead ? `/tasks/${row.id}` : undefined}
          editHref={canUpdate ? `/tasks/${row.id}/edit` : undefined}
          onDelete={
            canDelete && row.available_actions.includes("delete")
              ? () => setDeleting(row)
              : undefined
          }
        />
      )),
    ];
  }, [canDelete, canRead, canUpdate, showActions, userNameById]);

  const { columns, columnsDialog, colSpan } = useTableColumns("tasks.tasks", columnDefs);

  function clearFilters() {
    setParams({
      search: "",
      filters: {
        mine: null,
        overdue: null,
        due_this_week: null,
        assignee_ids: null,
        unassigned: null,
        label_ids: null,
        task_types: null,
        priorities: null,
        statuses: null,
        subtasks: null,
        swimlane: null,
      },
      page: 1,
    });
  }

  async function confirmDelete() {
    if (!deleting) return;
    try {
      await deleteTask.mutateAsync(deleting.id);
      toast.success("Task deleted");
      setDeleting(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  async function assignToMe(taskId: string) {
    if (!me?.id) return;
    try {
      await assignTask.mutateAsync({ id: taskId, values: { assignee_id: me.id } });
      toast.success("Assigned to you");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <ListPage>
      <PageHeader
        title="Tasks"
        subtitle="Org-wide tasks with list and kanban views."
        actions={
          canCreate ? (
            <Button
              type="button"
              onClick={() => {
                setBoardCreateStatus(null);
                setFormOpen(true);
              }}
            >
              <Plus />
              New task
            </Button>
          ) : null
        }
      />
      <DataTableToolbar>
        <ListSearch
          value={search ?? ""}
          onChange={(value) => setParams({ search: value, page: 1 })}
        />
        <div className="min-w-48">
          <Label className={toolbarLabelClass}>Type</Label>
          <MultiSelect
            className="min-h-9"
            options={TASK_TYPES.map((type) => ({
              value: type,
              label: TASK_TYPE_LABELS[type],
            }))}
            value={taskTypes}
            onValueChange={(value) =>
              setParams({
                filters: { task_types: serializeEnumList(value as TaskType[]) ?? null },
                page: 1,
              })
            }
          />
        </div>
        <div className="min-w-48">
          <Label className={toolbarLabelClass}>Priority</Label>
          <MultiSelect
            className="min-h-9"
            options={TASK_PRIORITIES.map((priority) => ({
              value: priority,
              label: TASK_PRIORITY_LABELS[priority],
            }))}
            value={priorities}
            onValueChange={(value) =>
              setParams({
                filters: { priorities: serializeEnumList(value as TaskPriority[]) ?? null },
                page: 1,
              })
            }
          />
        </div>
        <div className="min-w-48">
          <Label className={toolbarLabelClass}>Label</Label>
          <MultiSelect
            className="min-h-9"
            options={(labelsQuery.data ?? []).map((label) => ({
              value: label.id,
              label: label.name,
            }))}
            value={labelIds}
            onValueChange={(value) =>
              setParams({
                filters: { label_ids: serializeIdList(value) ?? null },
                page: 1,
              })
            }
          />
        </div>
        {!boardView ? (
          <div className="min-w-48">
            <Label className={toolbarLabelClass}>Status</Label>
            <MultiSelect
              className="min-h-9"
              options={TASK_STATUSES.map((status) => ({
                value: status,
                label: TASK_STATUS_LABELS[status],
              }))}
              value={statuses}
              onValueChange={(value) =>
                setParams({
                  filters: { statuses: serializeEnumList(value as TaskStatus[]) ?? null },
                  page: 1,
                })
              }
            />
          </div>
        ) : null}
        <SortDialog
          fields={SORT_FIELDS}
          sortBy={sort_by}
          sortOrder={sort_order}
          onApply={(next) => setParams({ ...next, page: 1 })}
        />
        {boardView ? (
          <div className="min-w-40">
            <Label className={toolbarLabelClass}>Swimlanes</Label>
            <Select
              value={swimlaneMode ?? "none"}
              onValueChange={(value) =>
                setParams({
                  filters: { swimlane: value === "none" ? null : value },
                  page: 1,
                })
              }
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Swimlanes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {SWIMLANE_MODES.map((mode) => (
                  <SelectItem key={mode} value={mode}>
                    {SWIMLANE_MODE_LABELS[mode]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}
        <div className="flex min-w-full flex-[1_1_100%] flex-wrap items-center gap-2">
          <TaskAssigneeFilter
            assigneeIds={assigneeIds}
            unassigned={filters.unassigned === "1"}
            onAssigneeChange={({ assigneeIds: nextAssigneeIds, unassigned: nextUnassigned }) =>
              setParams({
                filters: {
                  assignee_ids: serializeIdList(nextAssigneeIds) ?? null,
                  unassigned: nextUnassigned ? "1" : null,
                },
                page: 1,
              })
            }
          />
          <Button
            type="button"
            size="sm"
            variant={mine ? "secondary" : "outline"}
            onClick={() => setParams({ filters: { mine: mine ? null : "1" }, page: 1 })}
          >
            My open
          </Button>
          <Button
            type="button"
            size="sm"
            variant={overdue ? "secondary" : "outline"}
            onClick={() =>
              setParams({ filters: { overdue: overdue ? null : "1" }, page: 1 })
            }
          >
            Overdue
          </Button>
          <Button
            type="button"
            size="sm"
            variant={dueThisWeek ? "secondary" : "outline"}
            onClick={() =>
              setParams({ filters: { due_this_week: dueThisWeek ? null : "1" }, page: 1 })
            }
          >
            This week
          </Button>
          {boardView ? (
            <Button
              type="button"
              size="sm"
              variant={showSubtasksOnBoard ? "secondary" : "outline"}
              onClick={() =>
                setParams({
                  filters: { subtasks: showSubtasksOnBoard ? null : "1" },
                  page: 1,
                })
              }
            >
              Show subtasks
            </Button>
          ) : null}
          <div className="flex gap-1">
            <Button
              type="button"
              size="icon-sm"
              variant={!boardView ? "secondary" : "outline"}
              onClick={() => setParams({ filters: { view: null }, page: 1 })}
            >
              <Table2 />
            </Button>
            <Button
              type="button"
              size="icon-sm"
              variant={boardView ? "secondary" : "outline"}
              onClick={() => setParams({ filters: { view: "board" }, page: 1 })}
            >
              <LayoutGrid />
            </Button>
          </div>
          <div className="ml-auto shrink-0">{boardView ? lanePicker : columnsDialog}</div>
        </div>
      </DataTableToolbar>
      <ActiveFilterBar visible={hasActiveFilters} onClear={clearFilters}>
        {mine ? (
          <FilterChip label="My open" onRemove={() => setParams({ filters: { mine: null }, page: 1 })} />
        ) : null}
        {overdue ? (
          <FilterChip label="Overdue" onRemove={() => setParams({ filters: { overdue: null }, page: 1 })} />
        ) : null}
        {dueThisWeek ? (
          <FilterChip
            label="This week"
            onRemove={() => setParams({ filters: { due_this_week: null }, page: 1 })}
          />
        ) : null}
        {swimlaneMode ? (
          <FilterChip
            label={`Swimlanes: ${SWIMLANE_MODE_LABELS[swimlaneMode]}`}
            onRemove={() => setParams({ filters: { swimlane: null }, page: 1 })}
          />
        ) : null}
        {filters.unassigned === "1" ? (
          <FilterChip
            label="Unassigned"
            onRemove={() => setParams({ filters: { unassigned: null }, page: 1 })}
          />
        ) : null}
        {assigneeIds.map((id) => (
          <FilterChip
            key={id}
            label={userNameById.get(id) ?? id}
            onRemove={() =>
              setParams({
                filters: {
                  assignee_ids: serializeIdList(assigneeIds.filter((item) => item !== id)) ?? null,
                },
                page: 1,
              })
            }
          />
        ))}
        {taskTypes.map((type) => (
          <FilterChip
            key={type}
            label={TASK_TYPE_LABELS[type]}
            onRemove={() =>
              setParams({
                filters: {
                  task_types:
                    serializeEnumList(taskTypes.filter((item) => item !== type)) ?? null,
                },
                page: 1,
              })
            }
          />
        ))}
        {priorities.map((priority) => (
          <FilterChip
            key={priority}
            label={TASK_PRIORITY_LABELS[priority]}
            onRemove={() =>
              setParams({
                filters: {
                  priorities:
                    serializeEnumList(priorities.filter((item) => item !== priority)) ?? null,
                },
                page: 1,
              })
            }
          />
        ))}
        {labelIds.map((id) => {
          const label = labelsQuery.data?.find((item) => item.id === id);
          return (
            <FilterChip
              key={id}
              label={label?.name ?? id}
              onRemove={() =>
                setParams({
                  filters: {
                    label_ids: serializeIdList(labelIds.filter((item) => item !== id)) ?? null,
                  },
                  page: 1,
                })
              }
            />
          );
        })}
      </ActiveFilterBar>
      {!boardView && tasksQuery.isLoading ? <Skeleton className="h-64 w-full" /> : null}
      {!boardView && tasksQuery.isError ? (
        <DataTableError
          message={getErrorMessage(tasksQuery.error)}
          onRetry={() => tasksQuery.refetch()}
        />
      ) : null}
      {boardView ? (
        <TaskBoard
          statuses={boardStatuses}
          sharedFilters={sharedFilters}
          swimlaneMode={swimlaneMode}
          canCreate={canCreate}
          onOpenCreate={(status) => {
            setBoardCreateStatus(status);
            setFormOpen(true);
          }}
          onOpenTask={(taskId) => setParams({ filters: { task: taskId } })}
          onOpenParent={(taskId) => setParams({ filters: { task: taskId } })}
          onAssignToMe={assignToMe}
          onDeleteTask={(task) => setDeleting(task)}
          sheetOpen={Boolean(sheetTaskId)}
          onCloseSheet={() => setParams({ filters: { task: null } })}
        />
      ) : null}
      {!boardView && !tasksQuery.isLoading && !tasksQuery.isError ? (
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
                  <DataTableEmpty message={emptyListMessage(canCreate, "tasks")} />
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
      <TaskDetailSheet
        taskId={sheetTaskId}
        onOpenChange={(open) => {
          if (!open) {
            setParams({ filters: { task: null } });
          }
        }}
        onOpenTask={(taskId) => setParams({ filters: { task: taskId } })}
        canEdit={canUpdate}
        canCreate={canCreate}
      />
      <TaskFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) {
            setBoardCreateStatus(null);
          }
        }}
        initialStatus={boardCreateStatus ?? undefined}
      />
      <ConfirmActionDialog
        open={Boolean(deleting)}
        title="Delete task"
        description={`Delete ${deleting ? `"${deleting.title}"` : "this task"}? This cannot be undone.`}
        confirmLabel="Delete"
        pending={deleteTask.isPending}
        onOpenChange={(open) => !open && setDeleting(null)}
        onConfirm={() => void confirmDelete()}
      />
    </ListPage>
  );
}
