"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import { type ReactNode } from "react";

import { getErrorMessage } from "@/shared/api/errors";
import type { PaginationMeta } from "@/shared/api/envelope";
import { DataTable } from "@/shared/components/data-table/data-table";
import { DataTablePagination } from "@/shared/components/data-table/pagination";
import { DataTableEmpty, DataTableError } from "@/shared/components/data-table/states";
import { Button } from "@/shared/components/ui/button";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";

export type DocumentHistoryColumn<T> = {
  id: string;
  header: string;
  className?: string;
  cell: (row: T) => ReactNode;
};

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
  toolbar,
  expandedId,
  onToggleExpand,
  renderExpanded,
}: {
  columns: Array<DocumentHistoryColumn<T>>;
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
  toolbar?: ReactNode;
  expandedId?: string | null;
  onToggleExpand?: (id: string) => void;
  renderExpanded?: (row: T) => ReactNode;
}) {
  const expandEnabled = Boolean(onToggleExpand && renderExpanded);
  const colSpan = columns.length + (expandEnabled ? 1 : 0);

  return (
    <div className="flex flex-col gap-3">
      {toolbar}
      <DataTable footer={meta && onPageChange ? <DataTablePagination meta={meta} onPageChange={onPageChange} /> : null}>
        <TableHeader>
          <TableRow>
            {expandEnabled ? <TableHead className="w-8" /> : null}
            {columns.map((column) => (
              <TableHead key={column.id} className={column.className}>
                {column.header}
              </TableHead>
            ))}
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
                    </TableCell>
                  ) : null}
                  {columns.map((column) => (
                    <TableCell key={column.id} className={column.className}>
                      {column.cell(row)}
                    </TableCell>
                  ))}
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
