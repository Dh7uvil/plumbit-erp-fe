"use client";

import type { ProductInventoryListRow } from "@/modules/inventory-management/products/schemas";
import { DataTableCells, DataTableColumnHeads } from "@/shared/components/data-table/column-cells";
import type { DataTableColumn } from "@/shared/components/data-table/columns";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { cn } from "@/shared/lib/cn";

export function ProductInventoryListGrid({
  rows,
  columns,
  colSpan,
  selectedId,
  onSelect,
  className,
}: {
  rows: ProductInventoryListRow[];
  columns: readonly DataTableColumn<ProductInventoryListRow>[];
  colSpan: number;
  selectedId: string | null;
  onSelect: (row: ProductInventoryListRow) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "min-h-[10rem] overflow-auto overscroll-contain scroll-smooth rounded-lg border bg-background",
        "[-ms-overflow-style:none] [scrollbar-width:thin]",
        "[&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar]:w-2",
        "[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border",
        className,
      )}
    >
      <Table>
        <TableHeader className="sticky top-0 z-10 bg-muted/90 backdrop-blur-sm">
          <TableRow className="hover:bg-transparent">
            <DataTableColumnHeads columns={columns} />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={colSpan} className="text-muted-foreground h-28 text-center text-sm">
                No items match your search.
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => {
              const selected = selectedId === row.product_id;
              return (
                <TableRow
                  key={row.product_id}
                  data-state={selected ? "selected" : undefined}
                  aria-selected={selected}
                  className={cn(
                    "group cursor-pointer transition-colors",
                    selected
                      ? "bg-accent shadow-[inset_3px_0_0_0_var(--primary)] hover:bg-accent data-[state=selected]:bg-accent [&>td:last-child]:!bg-accent [&>td:last-child]:hover:!bg-accent"
                      : "hover:bg-muted",
                  )}
                  onClick={() => onSelect(row)}
                >
                  <DataTableCells columns={columns} row={row} />
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
