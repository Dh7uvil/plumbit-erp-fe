"use client";

import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import type { ReactNode } from "react";

import { toggleSort, type SortPatch } from "@/shared/components/data-table/sort";
import { TableHead } from "@/shared/components/ui/table";
import type { SortOrder } from "@/shared/hooks/use-table-params";
import { cn } from "@/shared/lib/cn";

export function SortableTableHead({
  field,
  sortBy,
  sortOrder,
  onSort,
  children,
  className,
}: {
  field: string;
  sortBy?: string;
  sortOrder?: SortOrder;
  onSort: (next: SortPatch) => void;
  children: ReactNode;
  className?: string;
}) {
  const active = sortBy === field;
  const ariaSort = active ? (sortOrder === "desc" ? "descending" : "ascending") : "none";
  const Icon = !active ? ArrowUpDown : sortOrder === "desc" ? ArrowDown : ArrowUp;
  const label = typeof children === "string" ? children : field;

  return (
    <TableHead className={className} aria-sort={ariaSort}>
      <button
        type="button"
        className={cn(
          "hover:text-foreground inline-flex items-center gap-1",
          className?.includes("text-right") && "w-full justify-end",
        )}
        aria-label={`Sort by ${label}`}
        onClick={() => onSort(toggleSort(sortBy, sortOrder, field))}
      >
        {children}
        <Icon className={cn("size-3.5", active ? "text-foreground" : "text-muted-foreground/70")} />
      </button>
    </TableHead>
  );
}

export function SortableHeads({
  headers,
  fieldByHeader,
  sortBy,
  sortOrder,
  onSort,
  classNameByHeader,
}: {
  headers: readonly string[];
  fieldByHeader: Partial<Record<string, string>>;
  sortBy?: string;
  sortOrder?: SortOrder;
  onSort: (next: SortPatch) => void;
  classNameByHeader?: Partial<Record<string, string>>;
}) {
  return (
    <>
      {headers.map((header) => {
        const field = fieldByHeader[header];
        const className = classNameByHeader?.[header];
        if (!field) {
          return (
            <TableHead key={header} className={className}>
              {header}
            </TableHead>
          );
        }
        return (
          <SortableTableHead
            key={header}
            field={field}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={onSort}
            className={className}
          >
            {header}
          </SortableTableHead>
        );
      })}
    </>
  );
}
