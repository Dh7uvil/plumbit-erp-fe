"use client";

import {
  stickyActionsCellClass,
  stickyActionsHeadClass,
  type DataTableColumn,
} from "@/shared/components/data-table/columns";
import { SortableTableHead } from "@/shared/components/data-table/sortable-head";
import type { SortPatch } from "@/shared/components/data-table/sort";
import { TableCell, TableHead } from "@/shared/components/ui/table";
import type { SortOrder } from "@/shared/hooks/use-table-params";
import { cn } from "@/shared/lib/cn";

export function DataTableColumnHeads<T>({
  columns,
  sortBy,
  sortOrder,
  onSort,
}: {
  columns: readonly DataTableColumn<T>[];
  sortBy?: string;
  sortOrder?: SortOrder;
  onSort?: (next: SortPatch) => void;
}) {
  return (
    <>
      {columns.map((column) => {
        const className = cn(
          column.headerClassName,
          column.sticky === "right" && stickyActionsHeadClass,
        );
        if (!column.sortableField || !onSort) {
          return (
            <TableHead key={column.id} className={className}>
              {column.header}
            </TableHead>
          );
        }
        return (
          <SortableTableHead
            key={column.id}
            field={column.sortableField}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={onSort}
            className={className}
          >
            {column.header}
          </SortableTableHead>
        );
      })}
    </>
  );
}

export function DataTableCells<T>({
  columns,
  row,
}: {
  columns: readonly DataTableColumn<T>[];
  row: T;
}) {
  return (
    <>
      {columns.map((column) => (
        <TableCell
          key={column.id}
          className={cn(column.className, column.sticky === "right" && stickyActionsCellClass)}
        >
          {column.cell(row)}
        </TableCell>
      ))}
    </>
  );
}
