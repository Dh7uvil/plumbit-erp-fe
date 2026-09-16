"use client";

import type { ReactNode } from "react";

import { actionsColumn, type DataTableColumn } from "@/shared/components/data-table/columns";
import { RecordLink } from "@/shared/components/data-table/record-link";
import { formatMoney } from "@/shared/lib/format";

export type PriceListItemRow = {
  id: string;
  product_id: string;
  sku: string;
  product_name: string;
  rate: string;
};

export function priceListItemColumnDefs({
  currencyCode,
  decimalPlaces,
  actions,
}: {
  currencyCode: string;
  decimalPlaces?: number;
  actions?: (row: PriceListItemRow) => ReactNode;
}): Array<DataTableColumn<PriceListItemRow>> {
  return [
    {
      id: "sku",
      header: "SKU",
      sortableField: "sku",
      className: "font-mono text-sm",
      cell: (row) => <RecordLink href={`/products/${row.product_id}`}>{row.sku || "—"}</RecordLink>,
    },
    {
      id: "product",
      header: "Product",
      sortableField: "product",
      className: "max-w-xs min-w-0 truncate font-medium",
      cell: (row) => (
        <RecordLink href={`/products/${row.product_id}`}>{row.product_name || "—"}</RecordLink>
      ),
    },
    {
      id: "rate",
      header: "Rate",
      sortableField: "rate",
      cell: (row) => (currencyCode ? formatMoney(row.rate, currencyCode, decimalPlaces) : "—"),
    },
    ...actionsColumn<PriceListItemRow>(Boolean(actions), (row) => actions?.(row)),
  ];
}
