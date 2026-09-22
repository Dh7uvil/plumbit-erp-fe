"use client";

import Link from "next/link";

import type {
  TradingHistoryLine,
  TradingPartyAggregate,
  TradingProductAggregate,
} from "@/modules/inventory-management/history/schemas";
import { omitColumnIds, type DataTableColumn } from "@/shared/components/data-table/columns";
import { RecordLink } from "@/shared/components/data-table/record-link";
import { formatDate, formatQuantity, formatReportMoney } from "@/shared/lib/format";

export type TradingHistoryKind =
  "product-sales" | "product-purchases" | "customer-sales" | "supplier-purchases";

function hrefForDocument(documentNumber: string, documentId: string): string {
  const prefix = documentNumber.split("-")[0]?.toUpperCase() ?? "";
  if (prefix === "GRN") {
    return `/goods-receipts/${documentId}`;
  }
  return `/delivery-notes/${documentId}`;
}

export function tradingHistoryColumnDefs({
  kind,
  showCost,
  documentHref,
  omit = [],
}: {
  kind: TradingHistoryKind;
  showCost: boolean;
  documentHref?: (row: TradingHistoryLine) => string;
  omit?: readonly string[];
}): Array<DataTableColumn<TradingHistoryLine>> {
  const partyLabel =
    kind === "product-purchases" || kind === "supplier-purchases" ? "Supplier" : "Customer";
  const partyHref =
    kind === "product-purchases" || kind === "supplier-purchases" ? "/suppliers" : "/customers";
  return omitColumnIds(
    [
      {
        id: "document",
        header: "Document",
        sortableField: "document_number",
        cell: (row) => (
          <RecordLink
            href={(
              documentHref ?? ((item) => hrefForDocument(item.document_number, item.document_id))
            )(row)}
          >
            {row.document_number}
          </RecordLink>
        ),
      },
      {
        id: "date",
        header: "Date",
        sortableField: "document_date",
        cell: (row) => formatDate(row.document_date),
      },
      {
        id: "party",
        header: partyLabel,
        sortableField: "party_name",
        cell: (row) => (
          <Link
            href={`${partyHref}/${row.party_id}`}
            className="underline-offset-4 hover:underline"
          >
            {row.party_name}
          </Link>
        ),
      },
      {
        id: "product",
        header: "Product",
        sortableField: "product_name",
        cell: (row) => (
          <Link href={`/products/${row.product_id}`} className="underline-offset-4 hover:underline">
            {row.sku} — {row.product_name}
          </Link>
        ),
      },
      {
        id: "qty",
        header: "Qty",
        sortableField: "quantity",
        className: "text-right",
        headerClassName: "text-right",
        cell: (row) => <span className="tabular-nums">{formatQuantity(row.quantity)}</span>,
      },
      {
        id: "invoiced",
        header: "Invoiced",
        className: "text-right",
        headerClassName: "text-right",
        cell: (row) => (
          <span className="tabular-nums">
            {row.invoiced_quantity != null ? formatQuantity(row.invoiced_quantity) : "—"}
          </span>
        ),
      },
      {
        id: "rate",
        header: "Rate",
        sortableField: "rate",
        className: "text-right",
        headerClassName: "text-right",
        cell: (row) => <span className="tabular-nums">{formatReportMoney(row.rate)}</span>,
      },
      {
        id: "revenue",
        header: "Revenue",
        sortableField: "revenue",
        className: "text-right",
        headerClassName: "text-right",
        cell: (row) => (
          <span className="tabular-nums">
            {row.revenue != null ? formatReportMoney(row.revenue) : "—"}
          </span>
        ),
      },
      ...(showCost
        ? [
            {
              id: "unit_cost",
              header: "Unit cost",
              className: "text-right",
              headerClassName: "text-right",
              cell: (row: TradingHistoryLine) => (
                <span className="tabular-nums">
                  {row.unit_cost != null ? formatReportMoney(row.unit_cost) : "—"}
                </span>
              ),
            },
            {
              id: "billed_cost",
              header: "Billed cost",
              className: "text-right",
              headerClassName: "text-right",
              cell: (row: TradingHistoryLine) => (
                <span className="tabular-nums">
                  {row.billed_cost != null ? formatReportMoney(row.billed_cost) : "—"}
                </span>
              ),
            },
            {
              id: "margin",
              header: "Margin",
              className: "text-right",
              headerClassName: "text-right",
              cell: (row: TradingHistoryLine) => (
                <span className="tabular-nums">
                  {row.margin != null ? formatReportMoney(row.margin) : "—"}
                </span>
              ),
            },
          ]
        : []),
    ],
    omit,
  );
}

export function tradingPartyAggregateColumnDefs(): Array<DataTableColumn<TradingPartyAggregate>> {
  return [
    {
      id: "party",
      header: "Customer",
      sortableField: "party_name",
      cell: (row) => (
        <Link href={`/customers/${row.party_id}`} className="underline-offset-4 hover:underline">
          {row.party_name}
        </Link>
      ),
    },
    {
      id: "qty",
      header: "Qty",
      sortableField: "total_quantity",
      className: "text-right",
      headerClassName: "text-right",
      cell: (row) => <span className="tabular-nums">{formatQuantity(row.total_quantity)}</span>,
    },
    {
      id: "invoiced",
      header: "Invoiced",
      className: "text-right",
      headerClassName: "text-right",
      cell: (row) => (
        <span className="tabular-nums">
          {row.invoiced_quantity != null ? formatQuantity(row.invoiced_quantity) : "—"}
        </span>
      ),
    },
    {
      id: "revenue",
      header: "Revenue",
      sortableField: "revenue",
      className: "text-right",
      headerClassName: "text-right",
      cell: (row) => (
        <span className="tabular-nums">
          {row.revenue != null ? formatReportMoney(row.revenue) : "—"}
        </span>
      ),
    },
    {
      id: "dispatches",
      header: "Dispatches",
      sortableField: "dispatch_count",
      className: "text-right",
      headerClassName: "text-right",
      cell: (row) => <span className="tabular-nums">{row.dispatch_count}</span>,
    },
    {
      id: "first",
      header: "First",
      cell: (row) => formatDate(row.first_date),
    },
    {
      id: "last",
      header: "Last",
      sortableField: "last_date",
      cell: (row) => formatDate(row.last_date),
    },
    {
      id: "last_rate",
      header: "Last rate",
      className: "text-right",
      headerClassName: "text-right",
      cell: (row) => <span className="tabular-nums">{formatReportMoney(row.last_rate)}</span>,
    },
  ];
}

export function tradingProductAggregateColumnDefs(): Array<
  DataTableColumn<TradingProductAggregate>
> {
  return [
    {
      id: "sku",
      header: "SKU",
      sortableField: "sku",
      className: "font-mono text-sm",
      cell: (row) => (
        <Link href={`/products/${row.product_id}`} className="underline-offset-4 hover:underline">
          {row.sku}
        </Link>
      ),
    },
    {
      id: "product",
      header: "Product",
      sortableField: "product_name",
      cell: (row) => (
        <Link href={`/products/${row.product_id}`} className="underline-offset-4 hover:underline">
          {row.product_name}
        </Link>
      ),
    },
    {
      id: "qty",
      header: "Qty",
      sortableField: "total_quantity",
      className: "text-right",
      headerClassName: "text-right",
      cell: (row) => <span className="tabular-nums">{formatQuantity(row.total_quantity)}</span>,
    },
    {
      id: "invoiced",
      header: "Invoiced",
      className: "text-right",
      headerClassName: "text-right",
      cell: (row) => (
        <span className="tabular-nums">
          {row.invoiced_quantity != null ? formatQuantity(row.invoiced_quantity) : "—"}
        </span>
      ),
    },
    {
      id: "revenue",
      header: "Revenue",
      sortableField: "revenue",
      className: "text-right",
      headerClassName: "text-right",
      cell: (row) => (
        <span className="tabular-nums">
          {row.revenue != null ? formatReportMoney(row.revenue) : "—"}
        </span>
      ),
    },
    {
      id: "dispatches",
      header: "Dispatches",
      sortableField: "dispatch_count",
      className: "text-right",
      headerClassName: "text-right",
      cell: (row) => <span className="tabular-nums">{row.dispatch_count}</span>,
    },
    {
      id: "first",
      header: "First",
      cell: (row) => formatDate(row.first_date),
    },
    {
      id: "last",
      header: "Last",
      sortableField: "last_date",
      cell: (row) => formatDate(row.last_date),
    },
    {
      id: "last_rate",
      header: "Last rate",
      className: "text-right",
      headerClassName: "text-right",
      cell: (row) => <span className="tabular-nums">{formatReportMoney(row.last_rate)}</span>,
    },
  ];
}
