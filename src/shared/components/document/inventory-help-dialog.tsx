"use client";

import Link from "next/link";

import { useProduct, useProductInquiry } from "@/modules/inventory-management/products/queries";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { formatDate, formatFixedDecimal, formatMoney } from "@/shared/lib/format";
import { useBaseCurrency } from "@/shared/hooks/use-base-currency";

export function InventoryHelpDialog({
  productId,
  open,
  onOpenChange,
}: {
  productId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const productQuery = useProduct(open ? productId : null);
  const inquiryQuery = useProductInquiry(open ? productId : null);
  const { baseCurrencyCode } = useBaseCurrency();
  const moneyCode = inquiryQuery.data?.lc_currency_code ?? baseCurrencyCode ?? "";
  const product = productQuery.data;
  const inquiry = inquiryQuery.data;
  const isLoading = productQuery.isLoading || inquiryQuery.isLoading;
  const substitutes = [product?.alias_2, product?.alias_3, product?.alias_4].filter(
    (value): value is string => Boolean(value?.trim()),
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Inventory help</DialogTitle>
          <DialogDescription>
            Stock, cost, and last trading activity for the focused line (F7).
          </DialogDescription>
        </DialogHeader>
        {!productId ? (
          <p className="text-muted-foreground text-sm">Select a product on a line first.</p>
        ) : isLoading ? (
          <p className="text-muted-foreground text-sm">Loading…</p>
        ) : productQuery.isError || inquiryQuery.isError ? (
          <p className="text-destructive text-sm">Could not load product inquiry.</p>
        ) : (
          <div className="flex flex-col gap-4 text-sm">
            <div>
              <p className="font-medium">
                {product?.sku} — {product?.name}
              </p>
              {product ? (
                <Link
                  href={`/products/${product.id}`}
                  className="text-muted-foreground underline-offset-4 hover:underline"
                >
                  Open product master
                </Link>
              ) : null}
            </div>
            {inquiry ? (
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
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
                  <div className="col-span-2">
                    <dt className="text-muted-foreground">Packing</dt>
                    <dd>
                      {inquiry.packing_label}
                      {inquiry.unit2_breakdown ? ` (${inquiry.unit2_breakdown})` : ""}
                    </dd>
                  </div>
                ) : null}
                {inquiry.avg_cost != null ? (
                  <div>
                    <dt className="text-muted-foreground">Avg cost</dt>
                    <dd className="tabular-nums">
                      {formatMoney(inquiry.avg_cost, moneyCode)}
                    </dd>
                  </div>
                ) : null}
                {inquiry.lc_price != null ? (
                  <div>
                    <dt className="text-muted-foreground">LC price</dt>
                    <dd className="tabular-nums">
                      {formatMoney(inquiry.lc_price, moneyCode)}
                    </dd>
                  </div>
                ) : null}
                {inquiry.last_sale_date ? (
                  <div className="col-span-2">
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
                  <div className="col-span-2">
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
            ) : null}
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
            {inquiry && inquiry.warehouses.length > 0 ? (
              <div>
                <p className="mb-2 font-medium">By warehouse</p>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Warehouse</TableHead>
                      <TableHead className="text-right">On hand</TableHead>
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
                          {formatFixedDecimal(row.qty_available, 3)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : null}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
