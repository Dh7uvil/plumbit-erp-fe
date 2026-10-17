"use client";

import Link from "next/link";

import { useProductInquiry } from "@/modules/inventory-management/products/queries";
import type { Product } from "@/modules/inventory-management/products/schemas";
import { getErrorMessage } from "@/shared/api/errors";
import { DataTableError } from "@/shared/components/data-table/states";
import { Button } from "@/shared/components/ui/button";
import { Skeleton } from "@/shared/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { useBaseCurrency } from "@/shared/hooks/use-base-currency";
import { formatDate, formatFixedDecimal, formatMoney } from "@/shared/lib/format";

export function ProductInquiryPanel({
  product,
  showStockLink = true,
}: {
  product: Product;
  showStockLink?: boolean;
}) {
  const inquiryQuery = useProductInquiry(product.id);
  const { baseCurrencyCode } = useBaseCurrency();
  const inquiry = inquiryQuery.data;
  const moneyCode = inquiry?.lc_currency_code ?? baseCurrencyCode ?? "";
  const substitutes = [product.alias_2, product.alias_3, product.alias_4].filter(
    (value): value is string => Boolean(value?.trim()),
  );

  if (inquiryQuery.isLoading) {
    return <Skeleton className="h-48 w-full" />;
  }

  if (inquiryQuery.isError) {
    return (
      <DataTableError
        message={getErrorMessage(inquiryQuery.error)}
        onRetry={() => inquiryQuery.refetch()}
      />
    );
  }

  if (!inquiry) {
    return <p className="text-muted-foreground text-sm">No inventory inquiry data.</p>;
  }

  return (
    <div className="flex flex-col gap-4 text-sm">
      {showStockLink ? (
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" size="sm" variant="outline" asChild>
            <Link href={`/stock/${product.id}`}>Stock balances &amp; movements</Link>
          </Button>
        </div>
      ) : null}
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-4">
        <div>
          <dt className="text-muted-foreground">On hand</dt>
          <dd className="tabular-nums">{formatFixedDecimal(inquiry.qty_on_hand, 3)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Available</dt>
          <dd className="tabular-nums">{formatFixedDecimal(inquiry.qty_available, 3)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Reserved</dt>
          <dd className="tabular-nums">{formatFixedDecimal(inquiry.qty_reserved, 3)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Incoming</dt>
          <dd className="tabular-nums">{formatFixedDecimal(inquiry.qty_incoming, 3)}</dd>
        </div>
        {inquiry.packing_label ? (
          <div className="col-span-2 sm:col-span-4">
            <dt className="text-muted-foreground">Packing</dt>
            <dd>
              {inquiry.packing_label}
              {inquiry.unit2_breakdown ? ` (${inquiry.unit2_breakdown})` : ""}
            </dd>
          </div>
        ) : null}
        {inquiry.avg_cost != null ? (
          <div>
            <dt className="text-muted-foreground">Avg cost (FIFO)</dt>
            <dd className="tabular-nums">{formatMoney(inquiry.avg_cost, moneyCode)}</dd>
          </div>
        ) : null}
        {inquiry.lc_price != null ? (
          <div>
            <dt className="text-muted-foreground">LC price</dt>
            <dd className="tabular-nums">{formatMoney(inquiry.lc_price, moneyCode)}</dd>
          </div>
        ) : null}
        {inquiry.last_sale_date ? (
          <div className="col-span-2 sm:col-span-4">
            <dt className="text-muted-foreground">Last sale</dt>
            <dd>
              {formatDate(inquiry.last_sale_date)}
              {inquiry.last_sale_price != null
                ? ` · ${formatMoney(inquiry.last_sale_price, moneyCode)}`
                : ""}
              {inquiry.last_sale_quantity != null
                ? ` × ${formatFixedDecimal(inquiry.last_sale_quantity, 3)}`
                : ""}
            </dd>
          </div>
        ) : null}
        {inquiry.last_purchase_date ? (
          <div className="col-span-2 sm:col-span-4">
            <dt className="text-muted-foreground">Last purchase</dt>
            <dd>
              {formatDate(inquiry.last_purchase_date)}
              {inquiry.last_purchase_price != null
                ? ` · ${formatMoney(inquiry.last_purchase_price, moneyCode)}`
                : ""}
              {inquiry.last_purchase_quantity != null
                ? ` × ${formatFixedDecimal(inquiry.last_purchase_quantity, 3)}`
                : ""}
            </dd>
          </div>
        ) : null}
      </dl>
      {substitutes.length > 0 ? (
        <div>
          <p className="mb-1 font-medium">Substitute / alias IDs</p>
          <ul className="text-muted-foreground list-inside list-disc">
            {substitutes.map((alias) => (
              <li key={alias}>{alias}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {inquiry.warehouses.length > 0 ? (
        <div>
          <p className="mb-2 font-medium">By warehouse</p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Warehouse</TableHead>
                <TableHead className="text-right">On hand</TableHead>
                <TableHead className="text-right">Reserved</TableHead>
                <TableHead className="text-right">Available</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inquiry.warehouses.map((row) => (
                <TableRow key={row.warehouse_id}>
                  <TableCell>{row.warehouse_name}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatFixedDecimal(row.qty_on_hand, 3)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatFixedDecimal(row.qty_reserved, 3)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatFixedDecimal(row.qty_available, 3)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : null}
    </div>
  );
}
