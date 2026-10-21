"use client";

import Link from "next/link";

import { ProductInquiryPanel } from "@/modules/inventory-management/products/components/product-inquiry-panel";
import { useProduct, useProductInquiry } from "@/modules/inventory-management/products/queries";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { formatFixedDecimal, formatMoney } from "@/shared/lib/format";
import { useBaseCurrency } from "@/shared/hooks/use-base-currency";

function WinsoftInventoryHelpStrip({ productId }: { productId: string }) {
  const inquiryQuery = useProductInquiry(productId);
  const { baseCurrencyCode } = useBaseCurrency();
  const inquiry = inquiryQuery.data;
  const moneyCode = inquiry?.lc_currency_code ?? baseCurrencyCode ?? "";

  if (inquiryQuery.isLoading) {
    return <p className="text-muted-foreground text-sm">Loading stock strip…</p>;
  }
  if (!inquiry) {
    return null;
  }

  return (
    <dl className="grid grid-cols-2 gap-x-3 gap-y-2 rounded-md border p-3 text-sm sm:grid-cols-4">
      <div>
        <dt className="text-muted-foreground">Net avail.</dt>
        <dd className="tabular-nums">{formatFixedDecimal(inquiry.net_available, 3)}</dd>
      </div>
      <div>
        <dt className="text-muted-foreground">Opened</dt>
        <dd className="tabular-nums">{formatFixedDecimal(inquiry.qty_opened, 3)}</dd>
      </div>
      <div>
        <dt className="text-muted-foreground">Committed</dt>
        <dd className="tabular-nums">{formatFixedDecimal(inquiry.qty_committed, 3)}</dd>
      </div>
      <div>
        <dt className="text-muted-foreground">Ordered</dt>
        <dd className="tabular-nums">{formatFixedDecimal(inquiry.ordered_qty, 3)}</dd>
      </div>
      <div>
        <dt className="text-muted-foreground">Shop</dt>
        <dd className="tabular-nums">{formatFixedDecimal(inquiry.shop_qty, 3)}</dd>
      </div>
      <div>
        <dt className="text-muted-foreground">Warehouse</dt>
        <dd className="tabular-nums">{formatFixedDecimal(inquiry.warehouse_qty, 3)}</dd>
      </div>
      {inquiry.avg_cost != null ? (
        <div>
          <dt className="text-muted-foreground">Avg cost</dt>
          <dd className="tabular-nums">{formatMoney(inquiry.avg_cost, moneyCode)}</dd>
        </div>
      ) : null}
      {inquiry.lc_price != null ? (
        <div>
          <dt className="text-muted-foreground">LC price</dt>
          <dd className="tabular-nums">{formatMoney(inquiry.lc_price, moneyCode)}</dd>
        </div>
      ) : null}
    </dl>
  );
}

export function InventoryHelpDialog({
  productId,
  open,
  onOpenChange,
  variant = "default",
}: {
  productId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  variant?: "default" | "winsoft";
}) {
  const productQuery = useProduct(open ? productId : null);
  const product = productQuery.data;
  const isLoading = productQuery.isLoading;
  const isWinsoft = variant === "winsoft";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Inventory help</DialogTitle>
          <DialogDescription>
            {isWinsoft
              ? "Stock positions, costs, and master fields for the focused line (F7)."
              : "Stock, cost, and last trading activity for the focused line (F7)."}
          </DialogDescription>
        </DialogHeader>
        {!productId ? (
          <p className="text-muted-foreground text-sm">Select a product on a line first.</p>
        ) : isLoading ? (
          <p className="text-muted-foreground text-sm">Loading…</p>
        ) : productQuery.isError || !product ? (
          <p className="text-destructive text-sm">Could not load product inquiry.</p>
        ) : (
          <div className="flex flex-col gap-4 text-sm">
            <div>
              <p className="font-medium">
                {product.sku} — {product.name}
              </p>
              <Link
                href={`/products/${product.id}`}
                className="text-muted-foreground underline-offset-4 hover:underline"
              >
                Open product master
              </Link>
            </div>
            {isWinsoft && productId ? <WinsoftInventoryHelpStrip productId={productId} /> : null}
            <ProductInquiryPanel
              product={product}
              showStockLink
              extended={isWinsoft}
              compact={isWinsoft}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
