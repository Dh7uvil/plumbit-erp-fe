"use client";

import type { ReactNode } from "react";

import { AlertCircle } from "lucide-react";

import { DataTable } from "@/shared/components/data-table/data-table";
import { DataTableEmpty, DataTableError } from "@/shared/components/data-table/states";
import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import { Skeleton } from "@/shared/components/ui/skeleton";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";

export function CrmReportTable({
  columns,
  rows,
  isLoading,
  isError,
  errorMessage,
  onRetry,
  emptyTitle,
  emptyMessage,
  truncated = false,
  footer,
  isEmpty = false,
}: {
  columns: string[];
  rows: ReactNode;
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  onRetry: () => void;
  emptyTitle: string;
  emptyMessage: string;
  truncated?: boolean;
  footer?: ReactNode;
  isEmpty?: boolean;
}) {
  const colSpan = columns.length;
  const showEmpty = !isLoading && !isError && Boolean(isEmpty);
  return (
    <>
      {truncated ? (
        <Alert>
          <AlertCircle />
          <AlertDescription>
            Results are limited to the first 200 groups. Narrow the filters to see the rest.
          </AlertDescription>
        </Alert>
      ) : null}
      <DataTable>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column}>{column}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={colSpan}>
                <Skeleton className="h-6 w-full" />
              </TableCell>
            </TableRow>
          ) : isError ? (
            <TableRow>
              <TableCell colSpan={colSpan}>
                <DataTableError message={errorMessage} onRetry={onRetry} />
              </TableCell>
            </TableRow>
          ) : showEmpty ? (
            <TableRow>
              <TableCell colSpan={colSpan}>
                <DataTableEmpty title={emptyTitle} message={emptyMessage} />
              </TableCell>
            </TableRow>
          ) : (
            <>
              {rows}
              {footer}
            </>
          )}
        </TableBody>
      </DataTable>
    </>
  );
}
