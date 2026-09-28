"use client";

import { useMemo } from "react";
import { toast } from "sonner";

import {
  BOARD_KEY_TO_STATUS,
  BOARD_STATUS_KEYS,
  TASK_STATUSES,
  TASK_STATUS_LABELS,
  type TaskStatus,
} from "@/modules/task-management/tasks/schemas";
import { getErrorMessage } from "@/shared/api/errors";
import { ColumnsDialog } from "@/shared/components/data-table/columns-dialog";
import {
  resolveTableColumns,
  type DataTableColumn,
} from "@/shared/components/data-table/columns";
import {
  useResetTableColumnPreferences,
  useSaveTableColumnPreferences,
} from "@/shared/table-preferences/mutations";
import { useTableColumnPreferences } from "@/shared/table-preferences/queries";

const BOARD_TABLE_KEY = "tasks.board";

const BOARD_COLUMN_DEFS: Array<DataTableColumn<{ id: string }>> = TASK_STATUSES.map(
  (status) => ({
    id: BOARD_STATUS_KEYS[status],
    header: TASK_STATUS_LABELS[status],
    cell: () => null,
  }),
);

export function useTaskBoardColumns() {
  const query = useTableColumnPreferences(BOARD_TABLE_KEY);
  const save = useSaveTableColumnPreferences(BOARD_TABLE_KEY);
  const reset = useResetTableColumnPreferences(BOARD_TABLE_KEY);

  const statuses = useMemo((): TaskStatus[] => {
    const visible = resolveTableColumns(BOARD_COLUMN_DEFS, query.data ?? null, 0);
    return visible
      .map((column) => BOARD_KEY_TO_STATUS[column.id])
      .filter((status): status is TaskStatus => Boolean(status));
  }, [query.data]);

  const picker = (
    <ColumnsDialog
      columns={BOARD_COLUMN_DEFS}
      preference={query.data ?? null}
      pinnedCount={0}
      title="Customize board lanes"
      pending={save.isPending || reset.isPending}
      onApply={async (next) => {
        try {
          await save.mutateAsync(next);
        } catch (error) {
          toast.error(getErrorMessage(error));
          throw error;
        }
      }}
      onReset={async () => {
        try {
          await reset.mutateAsync();
        } catch (error) {
          toast.error(getErrorMessage(error));
          throw error;
        }
      }}
    />
  );

  return { statuses: statuses.length > 0 ? statuses : [...TASK_STATUSES], picker };
}
