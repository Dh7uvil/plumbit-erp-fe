"use client";

import { useMemo } from "react";
import { toast } from "sonner";

import { getErrorMessage } from "@/shared/api/errors";
import { ColumnsDialog } from "@/shared/components/data-table/columns-dialog";
import { resolveTableColumns, type DataTableColumn } from "@/shared/components/data-table/columns";
import {
  useResetTableColumnPreferences,
  useSaveTableColumnPreferences,
} from "@/shared/table-preferences/mutations";
import { useTableColumnPreferences } from "@/shared/table-preferences/queries";

export function useTableColumns<T>(tableKey: string, defs: readonly DataTableColumn<T>[]) {
  const query = useTableColumnPreferences(tableKey);
  const save = useSaveTableColumnPreferences(tableKey);
  const reset = useResetTableColumnPreferences(tableKey);
  const columns = useMemo(() => resolveTableColumns(defs, query.data ?? null), [defs, query.data]);

  const columnsDialog = (
    <ColumnsDialog
      columns={defs}
      preference={query.data ?? null}
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

  return { columns, columnsDialog, colSpan: Math.max(columns.length, 1) };
}
