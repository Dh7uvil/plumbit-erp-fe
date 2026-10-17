"use client";

import Link from "next/link";

import { ProductInquiryPanel } from "@/modules/inventory-management/products/components/product-inquiry-panel";
import { useProduct } from "@/modules/inventory-management/products/queries";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";

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
  const product = productQuery.data;
  const isLoading = productQuery.isLoading;

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
            <ProductInquiryPanel product={product} showStockLink />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
