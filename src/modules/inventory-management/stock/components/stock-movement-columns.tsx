"use client";

import {
  qtyIsNegative,
  STOCK_MOVEMENT_TYPE_LABELS,
  stockMovementSourceHref,
  stockMovementSourceLabel,
  type StockMovement,
} from "@/modules/inventory-management/stock/schemas";
import { auditTimestampColumns } from "@/shared/components/data-table/audit-columns";
import { omitColumnIds, type DataTableColumn } from "@/shared/components/data-table/columns";
import { RecordLink } from "@/shared/components/data-table/record-link";
import { cn } from "@/shared/lib/cn";
import { formatDate, formatDateTime, formatMoney, formatQuantity } from "@/shared/lib/format";

export function MovementSourceCell({
  sourceType,
  sourceId,
}: {
  sourceType: string;
  sourceId: string;
}) {
  const href = stockMovementSourceHref(sourceType, sourceId);
  const label = stockMovementSourceLabel(sourceType);
  return href ? <RecordLink href={href}>{label}</RecordLink> : label;
}

export function stockMovementColumnDefs({
  canReadCost,
  currencyCode,
  omit = [],
}: {
  canReadCost: boolean;
  currencyCode: string;
  omit?: readonly string[];
}): Array<DataTableColumn<StockMovement>> {
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
        cell: (row) => (
          <RecordLink href={`/stock/${row.product_id}`}>{row.product_name}</RecordLink>
        ),
      },
      {
        id: "warehouse",
        header: "Warehouse",
        cell: (row) => row.warehouse_code,
      },
      {
        id: "document_date",
        header: "Date",
        sortableField: "document_date",
        cell: (row) => formatDate(row.document_date),
      },
      {
        id: "movement_type",
        header: "Type",
        cell: (row) => STOCK_MOVEMENT_TYPE_LABELS[row.movement_type],
      },
      {
        id: "qty",
        header: "Qty",
        sortableField: "qty",
        className: "text-right tabular-nums",
        headerClassName: "text-right",
        cell: (row) => (
          <span className={cn(qtyIsNegative(row.qty) && "text-destructive font-medium")}>
            {formatQuantity(row.qty)}
          </span>
        ),
      },
      {
        id: "source",
        header: "Source",
        className: "text-muted-foreground text-sm",
        cell: (row) => <MovementSourceCell sourceType={row.source_type} sourceId={row.source_id} />,
      },
      ...(canReadCost
        ? [
            {
              id: "unit_cost",
              header: "Unit cost",
              className: "text-right tabular-nums",
              headerClassName: "text-right",
              cell: (row: StockMovement) => formatMoney(row.unit_cost, currencyCode),
            },
            {
              id: "value",
              header: "Value",
              className: "text-right tabular-nums",
              headerClassName: "text-right",
              cell: (row: StockMovement) => formatMoney(row.value, currencyCode),
            },
          ]
        : []),
      {
        id: "qty_before",
        header: "Qty before",
        defaultVisible: false,
        className: "text-right tabular-nums",
        headerClassName: "text-right",
        cell: (row) => formatQuantity(row.qty_before),
      },
      {
        id: "qty_after",
        header: "Qty after",
        defaultVisible: false,
        className: "text-right tabular-nums",
        headerClassName: "text-right",
        cell: (row) => formatQuantity(row.qty_after),
      },
      {
        id: "occurred_at",
        header: "Occurred",
        defaultVisible: false,
        className: "text-muted-foreground text-xs",
        cell: (row) => formatDateTime(row.occurred_at),
      },
      {
        id: "notes",
        header: "Notes",
        defaultVisible: false,
        className: "text-muted-foreground max-w-xs truncate",
        cell: (row) => row.notes || "—",
      },
      ...auditTimestampColumns<StockMovement>(),
    ],
    omit,
  );
}
