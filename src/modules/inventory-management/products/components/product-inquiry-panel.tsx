"use client";

import Link from "next/link";

import {
  InquiryField,
  InquiryFieldGrid,
  InquirySection,
  InquiryTableShell,
} from "@/modules/inventory-management/products/components/product-inquiry-layout";
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
  extended = false,
  compact = false,
}: {
  product: Product;
  showStockLink?: boolean;
  extended?: boolean;
  compact?: boolean;
}) {
  const inquiryQuery = useProductInquiry(product.id);
  const { baseCurrencyCode } = useBaseCurrency();
  const inquiry = inquiryQuery.data;
  const moneyCode = inquiry?.lc_currency_code ?? baseCurrencyCode ?? "";
  const substitutes = [product.alias_2, product.alias_3, product.alias_4].filter(
    (value): value is string => Boolean(value?.trim()),
  );

  if (inquiryQuery.isLoading) {
    return <Skeleton className="h-48 w-full rounded-lg" />;
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

  if (extended && !compact) {
    return (
      <div className="flex flex-col gap-4">
        {showStockLink ? (
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" size="sm" variant="outline" asChild>
              <Link href={`/stock/${product.id}`}>Stock balances &amp; movements</Link>
            </Button>
          </div>
        ) : null}

        <InquirySection title="Stock levels">
          <InquiryFieldGrid>
            <InquiryField label="On hand" valueClassName="tabular-nums font-medium">
              {formatFixedDecimal(inquiry.qty_on_hand, 3)}
            </InquiryField>
            <InquiryField label="Available" valueClassName="tabular-nums">
              {formatFixedDecimal(inquiry.qty_available, 3)}
            </InquiryField>
            <InquiryField label="Reserved" valueClassName="tabular-nums">
              {formatFixedDecimal(inquiry.qty_reserved, 3)}
            </InquiryField>
            <InquiryField label="Incoming" valueClassName="tabular-nums">
              {formatFixedDecimal(inquiry.qty_incoming, 3)}
            </InquiryField>
            <InquiryField label="Opened" valueClassName="tabular-nums">
              {formatFixedDecimal(inquiry.qty_opened, 3)}
            </InquiryField>
            <InquiryField label="Committed" valueClassName="tabular-nums">
              {formatFixedDecimal(inquiry.qty_committed, 3)}
            </InquiryField>
            <InquiryField label="Net available" valueClassName="tabular-nums font-medium">
              {formatFixedDecimal(inquiry.net_available, 3)}
            </InquiryField>
            <InquiryField label="Ordered" valueClassName="tabular-nums">
              {formatFixedDecimal(inquiry.ordered_qty, 3)}
            </InquiryField>
            <InquiryField label="Shop" valueClassName="tabular-nums">
              {formatFixedDecimal(inquiry.shop_qty, 3)}
            </InquiryField>
            <InquiryField label="Warehouse" valueClassName="tabular-nums">
              {formatFixedDecimal(inquiry.warehouse_qty, 3)}
            </InquiryField>
          </InquiryFieldGrid>
        </InquirySection>

        <InquirySection title="Pricing">
          <InquiryFieldGrid className="lg:grid-cols-5">
            <InquiryField label="Avg. cost" valueClassName="tabular-nums font-semibold">
              {formatMoney(inquiry.avg_cost, moneyCode)}
            </InquiryField>
            <InquiryField label="LC price" valueClassName="tabular-nums">
              {formatMoney(inquiry.lc_price, moneyCode)}
            </InquiryField>
            <InquiryField label="Def. sale" valueClassName="tabular-nums">
              {formatMoney(inquiry.selling_rate, moneyCode)}
            </InquiryField>
            <InquiryField label="Price 1" valueClassName="tabular-nums">
              {formatMoney(inquiry.price_1, moneyCode)}
            </InquiryField>
            <InquiryField label="Price 2" valueClassName="tabular-nums">
              {formatMoney(inquiry.price_2, moneyCode)}
            </InquiryField>
          </InquiryFieldGrid>
        </InquirySection>

        <InquirySection title="Last sales & purchase">
          <InquiryFieldGrid className="lg:grid-cols-4">
            <InquiryField label="Last sale date" valueClassName="tabular-nums">
              {inquiry.last_sale_date ? formatDate(inquiry.last_sale_date) : "—"}
            </InquiryField>
            <InquiryField label="Last sale price" valueClassName="tabular-nums">
              {formatMoney(inquiry.last_sale_price, moneyCode)}
            </InquiryField>
            <InquiryField label="Last purchase date" valueClassName="tabular-nums">
              {inquiry.last_purchase_date ? formatDate(inquiry.last_purchase_date) : "—"}
            </InquiryField>
            <InquiryField label="Last purchase price" valueClassName="tabular-nums">
              {formatMoney(inquiry.last_purchase_price, moneyCode)}
            </InquiryField>
          </InquiryFieldGrid>
        </InquirySection>

        <InquirySection title="Item details">
          <InquiryFieldGrid>
            {inquiry.brand?.trim() ? (
              <InquiryField label="Brand">{inquiry.brand}</InquiryField>
            ) : null}
            {inquiry.engine?.trim() ? (
              <InquiryField label="Engine">{inquiry.engine}</InquiryField>
            ) : null}
            {inquiry.category_name ? (
              <InquiryField label="Category">{inquiry.category_name}</InquiryField>
            ) : null}
            {inquiry.tax_name ? (
              <InquiryField label="Tax">
                {inquiry.tax_name}
                {inquiry.tax_rate ? ` (${inquiry.tax_rate}%)` : ""}
              </InquiryField>
            ) : null}
            {inquiry.volume != null ? (
              <InquiryField label="CBM" valueClassName="tabular-nums">
                {formatFixedDecimal(inquiry.volume, 3)}
              </InquiryField>
            ) : null}
            {inquiry.packing_label ? (
              <InquiryField label="Packing" className="sm:col-span-2">
                {inquiry.packing_label}
                {inquiry.unit2_breakdown ? ` (${inquiry.unit2_breakdown})` : ""}
              </InquiryField>
            ) : null}
            {inquiry.rem?.trim() ? (
              <InquiryField label="Rem" className="col-span-full">
                {inquiry.rem}
              </InquiryField>
            ) : null}
            {inquiry.remarks?.trim() ? (
              <InquiryField label="Remarks" className="col-span-full">
                {inquiry.remarks}
              </InquiryField>
            ) : null}
          </InquiryFieldGrid>
          {substitutes.length > 0 ? (
            <div className="mt-4 border-t pt-4">
              <p className="text-muted-foreground mb-2 text-[0.65rem] font-medium tracking-wide uppercase">
                Aliases
              </p>
              <div className="flex flex-wrap gap-2">
                {substitutes.map((alias) => (
                  <span
                    key={alias}
                    className="bg-background rounded-md border px-2.5 py-1 font-mono text-xs"
                  >
                    {alias}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </InquirySection>

        {inquiry.warehouses.length > 0 ? (
          <InquirySection title="By warehouse">
            <InquiryTableShell>
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="h-9">Warehouse</TableHead>
                    <TableHead className="h-9 text-right">On hand</TableHead>
                    <TableHead className="h-9 text-right">Reserved</TableHead>
                    <TableHead className="h-9 text-right">Available</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inquiry.warehouses.map((row) => (
                    <TableRow key={row.warehouse_id}>
                      <TableCell className="font-medium">{row.warehouse_name}</TableCell>
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
            </InquiryTableShell>
          </InquirySection>
        ) : null}
      </div>
    );
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
      <InquirySection title="Stock">
        <InquiryFieldGrid>
          <InquiryField label="On hand" valueClassName="tabular-nums font-medium">
            {formatFixedDecimal(inquiry.qty_on_hand, 3)}
          </InquiryField>
          <InquiryField label="Available" valueClassName="tabular-nums">
            {formatFixedDecimal(inquiry.qty_available, 3)}
          </InquiryField>
          <InquiryField label="Reserved" valueClassName="tabular-nums">
            {formatFixedDecimal(inquiry.qty_reserved, 3)}
          </InquiryField>
          <InquiryField label="Incoming" valueClassName="tabular-nums">
            {formatFixedDecimal(inquiry.qty_incoming, 3)}
          </InquiryField>
          {inquiry.packing_label ? (
            <InquiryField label="Packing" className="col-span-full sm:col-span-2">
              {inquiry.packing_label}
              {inquiry.unit2_breakdown ? ` (${inquiry.unit2_breakdown})` : ""}
            </InquiryField>
          ) : null}
          <InquiryField label="Avg. cost" valueClassName="tabular-nums font-semibold">
            {formatMoney(inquiry.avg_cost, moneyCode)}
          </InquiryField>
          {inquiry.lc_price != null ? (
            <InquiryField label="LC price" valueClassName="tabular-nums">
              {formatMoney(inquiry.lc_price, moneyCode)}
            </InquiryField>
          ) : null}
        </InquiryFieldGrid>
      </InquirySection>
      {inquiry.warehouses.length > 0 ? (
        <InquirySection title="By warehouse">
          <InquiryTableShell>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
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
          </InquiryTableShell>
        </InquirySection>
      ) : null}
    </div>
  );
}
