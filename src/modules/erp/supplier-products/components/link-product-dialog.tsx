"use client";

import { useState } from "react";
import { toast } from "sonner";

import { catalogCurrencyMatches } from "@/modules/erp/supplier-products/catalog-line";
import { useLinkSupplierProduct } from "@/modules/erp/supplier-products/mutations";
import type { SupplierProduct } from "@/modules/erp/supplier-products/schemas";
import { ProductFormDialog } from "@/modules/inventory-management/products/components/product-form-dialog";
import { productPermissions } from "@/modules/inventory-management/products/permissions";
import { useAllProducts } from "@/modules/inventory-management/products/queries";
import type { ProductFormValues } from "@/modules/inventory-management/products/schemas";
import { getErrorMessage } from "@/shared/api/errors";
import { useCrudPermissions } from "@/shared/auth/use-crud-permissions";
import { MasterSelect } from "@/shared/components/form/master-select";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";

function createPrefill(
  row: SupplierProduct,
  rateCurrencyId?: string | null,
): Partial<ProductFormValues> {
  const matches = rateCurrencyId == null || catalogCurrencyMatches(row.currency_id, rateCurrencyId);
  return {
    name: row.supplier_item_name,
    purchase_description: row.supplier_description ?? "",
    purchase_rate: matches && row.price ? row.price : "0",
  };
}

export function LinkProductDialog({
  open,
  supplierProduct,
  rateCurrencyId,
  nested = false,
  onOpenChange,
  onLinked,
}: {
  open: boolean;
  supplierProduct: SupplierProduct | null;
  rateCurrencyId?: string | null;
  nested?: boolean;
  onOpenChange: (open: boolean) => void;
  onLinked?: (entity: SupplierProduct) => void;
}) {
  const { canCreate } = useCrudPermissions(productPermissions);
  const productsQuery = useAllProducts(open);
  const linkProduct = useLinkSupplierProduct();
  const [productId, setProductId] = useState("");
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const products = productsQuery.data ?? [];

  function handleOpenChange(next: boolean) {
    if (!next) {
      setProductId("");
      setFormError(null);
      setCreating(false);
    }
    onOpenChange(next);
  }

  async function linkTo(id: string) {
    if (!supplierProduct) {
      return;
    }
    setFormError(null);
    try {
      const linked = await linkProduct.mutateAsync({ id: supplierProduct.id, productId: id });
      toast.success("Product linked");
      onLinked?.(linked);
      handleOpenChange(false);
    } catch (error) {
      setFormError(getErrorMessage(error));
    }
  }

  return (
    <>
      <Dialog open={open && !creating} onOpenChange={handleOpenChange}>
        <DialogContent nested={nested} className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Link a product</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            {formError ? <p className="text-destructive text-sm">{formError}</p> : null}
            <p className="text-muted-foreground text-sm">
              Map {supplierProduct ? `"${supplierProduct.supplier_sku}"` : "this supplier SKU"} to
              one of your products.
            </p>
            <MasterSelect
              value={productId}
              onValueChange={setProductId}
              disabled={productsQuery.isLoading || linkProduct.isPending}
              placeholder="Select a product"
              searchPlaceholder="Search product…"
              createLabel="Create product from this item"
              onCreate={canCreate ? () => setCreating(true) : undefined}
              asFormControl={false}
              aria-label="Product"
              options={products.map((product) => ({
                value: product.id,
                label: `${product.sku} — ${product.name}`,
              }))}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={linkProduct.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={!productId || linkProduct.isPending}
              onClick={() => void linkTo(productId)}
            >
              Link product
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ProductFormDialog
        open={creating}
        product={null}
        nested
        initialValues={supplierProduct ? createPrefill(supplierProduct, rateCurrencyId) : undefined}
        onCreated={(entity) => {
          void linkTo(entity.id);
        }}
        onOpenChange={(next) => {
          setCreating(next);
          if (!next && !supplierProduct) {
            handleOpenChange(false);
          }
        }}
      />
    </>
  );
}
