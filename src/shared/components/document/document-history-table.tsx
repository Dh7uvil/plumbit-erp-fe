"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import { type ReactNode } from "react";

import { getErrorMessage } from "@/shared/api/errors";
import type { PaginationMeta } from "@/shared/api/envelope";
import { DataTableColumnHeads, DataTableCells } from "@/shared/components/data-table/column-cells";
import { type DataTableColumn } from "@/shared/components/data-table/columns";
import { DataTable } from "@/shared/components/data-table/data-table";
import { DataTablePagination } from "@/shared/components/data-table/pagination";
import type { SortPatch } from "@/shared/components/data-table/sort";
import { DataTableEmpty, DataTableError } from "@/shared/components/data-table/states";
import { Button } from "@/shared/components/ui/button";
import { Skeleton } from "@/shared/components/ui/skeleton";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/components/ui/tooltip";
import type { SortOrder } from "@/shared/hooks/use-table-params";

export type DocumentHistoryColumn<T> = DataTableColumn<T>;

export function DocumentHistoryTable<T>({
  columns,
  rows,
  getRowId,
  isLoading,
  isError,
  error,
  onRetry,
  emptyTitle,
  emptyMessage,
  meta,
  onPageChange,
  onPageSizeChange,
  toolbar,
  expandedId,
  onToggleExpand,
  renderExpanded,
  sortBy,
  sortOrder,
  onSort,
}: {
  columns: Array<DataTableColumn<T>>;
  rows: T[];
  getRowId: (row: T) => string;
  isLoading: boolean;
  isError: boolean;
  error?: unknown;
  onRetry: () => void;
  emptyTitle: string;
  emptyMessage: string;
  meta?: PaginationMeta;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  toolbar?: ReactNode;
  expandedId?: string | null;
  onToggleExpand?: (id: string) => void;
  renderExpanded?: (row: T) => ReactNode;
  sortBy?: string;
  sortOrder?: SortOrder;
  onSort?: (next: SortPatch) => void;
}) {
  const expandEnabled = Boolean(onToggleExpand && renderExpanded);
  const colSpan = columns.length + (expandEnabled ? 1 : 0);

  return (
    <div className="flex flex-col gap-3">
      {toolbar}
      <DataTable
        variant="embedded"
        footer={
          meta && onPageChange ? (
            <DataTablePagination
              meta={meta}
              onPageChange={onPageChange}
              onPageSizeChange={onPageSizeChange}
            />
          ) : null
        }
      >
        <TableHeader>
          <TableRow>
            {expandEnabled ? <TableHead className="w-8 min-w-8" /> : null}
            <DataTableColumnHeads
              columns={columns}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSort={onSort}
            />
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 3 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell colSpan={colSpan}>
                  <Skeleton className="h-6 w-full" />
                </TableCell>
              </TableRow>
            ))
          ) : isError ? (
            <TableRow>
              <TableCell colSpan={colSpan}>
                <DataTableError message={getErrorMessage(error)} onRetry={onRetry} />
              </TableCell>
            </TableRow>
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={colSpan}>
                <DataTableEmpty title={emptyTitle} message={emptyMessage} />
              </TableCell>
            </TableRow>
          ) : (
            rows.flatMap((row) => {
              const id = getRowId(row);
              const expanded = expandedId === id;
              const main = (
                <TableRow key={id}>
                  {expandEnabled ? (
                    <TableCell className="w-8">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-7"
                            aria-expanded={expanded}
                            aria-label={expanded ? "Collapse row" : "Expand row"}
                            onClick={() => onToggleExpand?.(id)}
                          >
                            {expanded ? (
                              <ChevronDown className="size-3.5" />
                            ) : (
                              <ChevronRight className="size-3.5" />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>{expanded ? "Collapse" : "Expand"}</TooltipContent>
                      </Tooltip>
                    </TableCell>
                  ) : null}
                  <DataTableCells columns={columns} row={row} />
                </TableRow>
              );
              if (!expanded || !renderExpanded) {
                return [main];
              }
              return [
                main,
                <TableRow key={`${id}-expanded`}>
                  <TableCell colSpan={colSpan} className="bg-muted/40">
                    {renderExpanded(row)}
                  </TableCell>
                </TableRow>,
              ];
            })
          )}
        </TableBody>
      </DataTable>
    </div>
  );
}
