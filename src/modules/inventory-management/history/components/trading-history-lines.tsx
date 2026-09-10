"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { historyPermissions } from "@/modules/inventory-management/history/permissions";
import {
  useCustomerSalesHistory,
  useProductPurchaseHistory,
  useProductSalesHistory,
  useSupplierPurchaseHistory,
} from "@/modules/inventory-management/history/queries";
import type { TradingHistoryLine } from "@/modules/inventory-management/history/schemas";
import {
  DocumentHistoryTable,
  type DocumentHistoryColumn,
} from "@/shared/components/document/document-history-table";
import { RecordLink } from "@/shared/components/data-table/record-link";
import { formatDate, formatDecimal } from "@/shared/lib/format";
import { useCan } from "@/shared/providers/session-provider";

function hrefForDocument(documentNumber: string, documentId: string): string {
  const prefix = documentNumber.split("-")[0]?.toUpperCase() ?? "";
  if (prefix === "DN") {
    return `/delivery-notes/${documentId}`;
  }
  if (prefix === "GRN") {
    return `/goods-receipts/${documentId}`;
  }
  return `/delivery-notes/${documentId}`;
}

export function TradingHistoryLines({
  kind,
  ownerId,
  partyId,
  productId,
  documentHref,
}: {
  kind: "product-sales" | "product-purchases" | "customer-sales" | "supplier-purchases";
  ownerId: string;
  partyId?: string;
  productId?: string;
  documentHref?: (row: TradingHistoryLine) => string;
}) {
  const can = useCan();
  const showCost = can(historyPermissions.cost);
  const [page, setPage] = useState(1);
  const params = { page, page_size: 10, party_id: partyId, product_id: productId };
  const productSales = useProductSalesHistory(ownerId, params, kind === "product-sales");
  const productPurchases = useProductPurchaseHistory(
    ownerId,
    params,
    kind === "product-purchases",
  );
  const customerSales = useCustomerSalesHistory(ownerId, params, kind === "customer-sales");
  const supplierPurchases = useSupplierPurchaseHistory(
    ownerId,
    params,
    kind === "supplier-purchases",
  );
  const query =
    kind === "product-sales"
      ? productSales
      : kind === "product-purchases"
        ? productPurchases
        : kind === "customer-sales"
          ? customerSales
          : supplierPurchases;
  const rows = query.data?.data ?? [];
  const showParty = kind === "product-sales" || kind === "product-purchases";
  const showProduct = kind === "customer-sales" || kind === "supplier-purchases";

  const columns = useMemo(() => {
    const cols: Array<DocumentHistoryColumn<TradingHistoryLine>> = [
      {
        id: "document",
        header: "Document",
        cell: (row) => (
          <RecordLink href={(documentHref ?? ((item) => hrefForDocument(item.document_number, item.document_id)))(row)}>
            {row.document_number}
          </RecordLink>
        ),
      },
      {
        id: "date",
        header: "Date",
        cell: (row) => formatDate(row.document_date),
      },
    ];
    if (showParty) {
      cols.push({
        id: "party",
        header: kind === "product-purchases" ? "Supplier" : "Customer",
        cell: (row) =>
          kind === "product-purchases" ? (
            <Link href={`/suppliers/${row.party_id}`} className="underline-offset-4 hover:underline">
              {row.party_name}
            </Link>
          ) : (
            <Link href={`/customers/${row.party_id}`} className="underline-offset-4 hover:underline">
              {row.party_name}
            </Link>
          ),
      });
    }
    if (showProduct) {
      cols.push({
        id: "product",
        header: "Product",
        cell: (row) => (
          <Link href={`/products/${row.product_id}`} className="underline-offset-4 hover:underline">
            {row.sku} — {row.product_name}
          </Link>
        ),
      });
    }
    cols.push(
      {
        id: "qty",
        header: "Qty",
        className: "text-right",
        cell: (row) => <span className="tabular-nums">{formatDecimal(row.quantity)}</span>,
      },
      {
        id: "invoiced",
        header: "Invoiced",
        className: "text-right",
        cell: (row) => (
          <span className="tabular-nums">
            {row.invoiced_quantity != null ? formatDecimal(row.invoiced_quantity) : "—"}
          </span>
        ),
      },
      {
        id: "rate",
        header: "Rate",
        className: "text-right",
        cell: (row) => <span className="tabular-nums">{formatDecimal(row.rate)}</span>,
      },
      {
        id: "revenue",
        header: "Revenue",
        className: "text-right",
        cell: (row) => (
          <span className="tabular-nums">{row.revenue != null ? formatDecimal(row.revenue) : "—"}</span>
        ),
      },
    );
    if (showCost) {
      cols.push(
        {
          id: "cost",
          header: "Unit cost",
          className: "text-right",
          cell: (row) => (
            <span className="tabular-nums">
              {row.unit_cost != null ? formatDecimal(row.unit_cost) : "—"}
            </span>
          ),
        },
        {
          id: "billed",
          header: "Billed cost",
          className: "text-right",
          cell: (row) => (
            <span className="tabular-nums">
              {row.billed_cost != null ? formatDecimal(row.billed_cost) : "—"}
            </span>
          ),
        },
        {
          id: "margin",
          header: "Margin",
          className: "text-right",
          cell: (row) => (
            <span className="tabular-nums">{row.margin != null ? formatDecimal(row.margin) : "—"}</span>
          ),
        },
      );
    }
    return cols;
  }, [documentHref, kind, showCost, showParty, showProduct]);

  return (
    <DocumentHistoryTable
      columns={columns}
      rows={rows}
      getRowId={(row) => `${row.document_id}-${row.product_id}-${row.document_date}`}
      isLoading={query.isLoading}
      isError={query.isError}
      error={query.error}
      onRetry={() => query.refetch()}
      emptyTitle="No history"
      emptyMessage="No posted lines for this selection."
      meta={query.data?.meta}
      onPageChange={setPage}
    />
  );
}
