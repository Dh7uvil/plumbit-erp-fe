"use client";

import type { ReactNode } from "react";

import {
  qtyIsBelowReorder,
  qtyIsNegative,
  type StockBalance,
} from "@/modules/inventory-management/stock/schemas";
import { auditTimestampColumns } from "@/shared/components/data-table/audit-columns";
import {
  actionsColumn,
  omitColumnIds,
  type DataTableColumn,
} from "@/shared/components/data-table/columns";
import { RecordLink } from "@/shared/components/data-table/record-link";
import { Badge } from "@/shared/components/ui/badge";
import { cn } from "@/shared/lib/cn";
import { formatDateTime, formatMoney, formatQuantity } from "@/shared/lib/format";

export function stockQtyCell(value: string, emphasizeNegative = false) {
  const negative = emphasizeNegative && qtyIsNegative(value);
  return (
    <span className={cn("tabular-nums", negative && "text-destructive font-medium")}>
      {formatQuantity(value)}
    </span>
  );
}

export function stockBalanceColumnDefs({
  canReadCost,
  currencyCode,
  actions,
  omit = [],
}: {
  canReadCost: boolean;
  currencyCode: string;
  actions?: (row: StockBalance) => ReactNode;
  omit?: readonly string[];
}): Array<DataTableColumn<StockBalance>> {
  return omitColumnIds(
    [
      {
        id: "sku",
        header: "SKU",
        className: "font-mono text-sm",
        cell: (row) => <RecordLink href={`/stock/${row.product_id}`}>{row.sku}</RecordLink>,
      },
      {
        id: "product",
        header: "Product",
        className: "font-medium",
        cell: (row) => (
          <RecordLink href={`/stock/${row.product_id}`}>{row.product_name}</RecordLink>
        ),
      },
      {
        id: "warehouse",
        header: "Warehouse",
        cell: (row) => {
          const belowReorder = qtyIsBelowReorder(row.qty_available, row.reorder_level);
          return (
            <>
              {row.warehouse_code}
              {row.warehouse_name ? ` — ${row.warehouse_name}` : ""}
              {belowReorder ? (
                <Badge variant="warning" className="ml-2">
                  Below reorder
                </Badge>
              ) : null}
            </>
          );
        },
      },
      {
        id: "qty_on_hand",
        header: "On hand",
        sortableField: "qty_on_hand",
        className: "text-right",
        headerClassName: "text-right",
        cell: (row) => stockQtyCell(row.qty_on_hand, true),
      },
      {
        id: "qty_quality_hold",
        header: "QC hold",
        sortableField: "qty_quality_hold",
        className: "text-right",
        headerClassName: "text-right",
        cell: (row) => stockQtyCell(row.qty_quality_hold),
      },
      {
        id: "qty_reserved",
        header: "Committed",
        sortableField: "qty_reserved",
        className: "text-right",
        headerClassName: "text-right",
        cell: (row) => stockQtyCell(row.qty_reserved),
      },
      {
        id: "qty_available",
        header: "Available",
        sortableField: "qty_available",
        className: "text-right",
        headerClassName: "text-right",
        cell: (row) => stockQtyCell(row.qty_available, true),
      },
      {
        id: "qty_incoming",
        header: "Incoming",
        className: "text-right",
        headerClassName: "text-right",
        cell: (row) => stockQtyCell(row.qty_incoming),
      },
      {
        id: "qty_outgoing",
        header: "Outgoing",
        className: "text-right",
        headerClassName: "text-right",
        cell: (row) => stockQtyCell(row.qty_outgoing),
      },
      {
        id: "qty_in_transit",
        header: "In transit",
        className: "text-right",
        headerClassName: "text-right",
        cell: (row) => stockQtyCell(row.qty_in_transit),
      },
      ...(canReadCost
        ? [
            {
              id: "unit_cost",
              header: "Unit cost",
              className: "text-right tabular-nums",
              headerClassName: "text-right",
              cell: (row: StockBalance) => formatMoney(row.unit_cost, currencyCode),
            },
            {
              id: "value",
              header: "Value",
              className: "text-right tabular-nums",
              headerClassName: "text-right",
              cell: (row: StockBalance) => formatMoney(row.stock_value, currencyCode),
            },
          ]
        : []),
      {
        id: "reorder_level",
        header: "Reorder level",
        defaultVisible: false,
        className: "text-right tabular-nums",
        headerClassName: "text-right",
        cell: (row) => formatQuantity(row.reorder_level),
      },
      {
        id: "reorder_qty",
        header: "Reorder qty",
        defaultVisible: false,
        className: "text-right tabular-nums",
        headerClassName: "text-right",
        cell: (row) => formatQuantity(row.reorder_qty),
      },
      {
        id: "last_movement_at",
        header: "Last movement",
        defaultVisible: false,
        className: "text-muted-foreground text-xs",
        cell: (row) => formatDateTime(row.last_movement_at),
      },
      ...auditTimestampColumns<StockBalance>(),
      ...actionsColumn<StockBalance>(Boolean(actions), (row) => actions?.(row)),
    ],
    omit,
  );
}
