"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { TradingHistoryLines } from "@/modules/inventory-management/history/components/trading-history-lines";
import { historyPermissions } from "@/modules/inventory-management/history/permissions";
import {
  useCustomerProducts,
  useProductCustomers,
} from "@/modules/inventory-management/history/queries";
import type {
  TradingPartyAggregate,
  TradingProductAggregate,
} from "@/modules/inventory-management/history/schemas";
import {
  DocumentHistoryTable,
  type DocumentHistoryColumn,
} from "@/shared/components/document/document-history-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { formatDate, formatDecimal } from "@/shared/lib/format";
import { useCan } from "@/shared/providers/session-provider";

export function ProductCustomersCard({ productId }: { productId: string }) {
  const can = useCan();
  const enabled = can(historyPermissions.product);
  const query = useProductCustomers(productId, enabled);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const rows = query.data?.data ?? [];
  const columns = useMemo<Array<DocumentHistoryColumn<TradingPartyAggregate>>>(
    () => [
      {
        id: "party",
        header: "Customer",
        cell: (row) => (
          <Link href={`/customers/${row.party_id}`} className="underline-offset-4 hover:underline">
            {row.party_name}
          </Link>
        ),
      },
      {
        id: "qty",
        header: "Qty",
        className: "text-right",
        cell: (row) => <span className="tabular-nums">{formatDecimal(row.total_quantity)}</span>,
      },
      {
        id: "dispatches",
        header: "Dispatches",
        className: "text-right",
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
        cell: (row) => formatDate(row.last_date),
      },
      {
        id: "rate",
        header: "Last rate",
        className: "text-right",
        cell: (row) => <span className="tabular-nums">{formatDecimal(row.last_rate)}</span>,
      },
    ],
    [],
  );

  if (!enabled) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Customers</CardTitle>
      </CardHeader>
      <CardContent>
        <DocumentHistoryTable
          columns={columns}
          rows={rows}
          getRowId={(row) => row.party_id}
          isLoading={query.isLoading}
          isError={query.isError}
          error={query.error}
          onRetry={() => query.refetch()}
          emptyTitle="No customers"
          emptyMessage="No posted sales for this product yet."
          expandedId={expandedId}
          onToggleExpand={(id) => setExpandedId((current) => (current === id ? null : id))}
          renderExpanded={(row) => (
            <TradingHistoryLines kind="product-sales" ownerId={productId} partyId={row.party_id} />
          )}
        />
      </CardContent>
    </Card>
  );
}

export function ProductSalesHistoryCard({ productId }: { productId: string }) {
  const can = useCan();
  const enabled = can(historyPermissions.product);
  if (!enabled) {
    return null;
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Sales history</CardTitle>
      </CardHeader>
      <CardContent>
        <TradingHistoryLines
          kind="product-sales"
          ownerId={productId}
          documentHref={(row) => `/delivery-notes/${row.document_id}`}
        />
      </CardContent>
    </Card>
  );
}

export function ProductPurchaseHistoryCard({ productId }: { productId: string }) {
  const can = useCan();
  const enabled = can(historyPermissions.product);
  if (!enabled) {
    return null;
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Purchase history</CardTitle>
      </CardHeader>
      <CardContent>
        <TradingHistoryLines
          kind="product-purchases"
          ownerId={productId}
          documentHref={(row) => `/goods-receipts/${row.document_id}`}
        />
      </CardContent>
    </Card>
  );
}

export function CustomerSoldItemsCard({ customerId }: { customerId: string }) {
  const can = useCan();
  const enabled = can(historyPermissions.customer);
  const query = useCustomerProducts(customerId, enabled);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const rows = query.data?.data ?? [];
  const columns = useMemo<Array<DocumentHistoryColumn<TradingProductAggregate>>>(
    () => [
      {
        id: "product",
        header: "Product",
        cell: (row) => (
          <Link href={`/products/${row.product_id}`} className="underline-offset-4 hover:underline">
            {row.sku} — {row.product_name}
          </Link>
        ),
      },
      {
        id: "qty",
        header: "Qty",
        className: "text-right",
        cell: (row) => <span className="tabular-nums">{formatDecimal(row.total_quantity)}</span>,
      },
      {
        id: "dispatches",
        header: "Dispatches",
        className: "text-right",
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
        cell: (row) => formatDate(row.last_date),
      },
      {
        id: "rate",
        header: "Last rate",
        className: "text-right",
        cell: (row) => <span className="tabular-nums">{formatDecimal(row.last_rate)}</span>,
      },
    ],
    [],
  );

  if (!enabled) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Sold items</CardTitle>
      </CardHeader>
      <CardContent>
        <DocumentHistoryTable
          columns={columns}
          rows={rows}
          getRowId={(row) => row.product_id}
          isLoading={query.isLoading}
          isError={query.isError}
          error={query.error}
          onRetry={() => query.refetch()}
          emptyTitle="No sold items"
          emptyMessage="No posted sales for this customer yet."
          expandedId={expandedId}
          onToggleExpand={(id) => setExpandedId((current) => (current === id ? null : id))}
          renderExpanded={(row) => (
            <TradingHistoryLines
              kind="customer-sales"
              ownerId={customerId}
              productId={row.product_id}
            />
          )}
        />
      </CardContent>
    </Card>
  );
}

export function CustomerSalesHistoryCard({ customerId }: { customerId: string }) {
  const can = useCan();
  const enabled = can(historyPermissions.customer);
  if (!enabled) {
    return null;
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Sales history</CardTitle>
      </CardHeader>
      <CardContent>
        <TradingHistoryLines kind="customer-sales" ownerId={customerId} />
      </CardContent>
    </Card>
  );
}

export function SupplierPurchaseHistoryCard({ supplierId }: { supplierId: string }) {
  const can = useCan();
  const enabled = can(historyPermissions.supplier);
  if (!enabled) {
    return null;
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Purchase history</CardTitle>
      </CardHeader>
      <CardContent>
        <TradingHistoryLines
          kind="supplier-purchases"
          ownerId={supplierId}
          documentHref={(row) => `/goods-receipts/${row.document_id}`}
        />
      </CardContent>
    </Card>
  );
}
