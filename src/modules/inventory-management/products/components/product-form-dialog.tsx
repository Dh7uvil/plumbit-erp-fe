"use client";

import { ProductForm } from "@/modules/inventory-management/products/components/product-form";
import { productPermissions } from "@/modules/inventory-management/products/permissions";
import type { Product } from "@/modules/inventory-management/products/schemas";
import {
  formDialogTitle,
  resolveFormDialogMode,
  useCrudPermissions,
} from "@/shared/auth/use-crud-permissions";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";

export function ProductFormDialog({
  open,
  product,
  onOpenChange,
  onCreated,
  nested = false,
  forceReadOnly = false,
}: {
  open: boolean;
  product: Product | null;
  onOpenChange: (open: boolean) => void;
  onCreated?: (entity: Product) => void;
  nested?: boolean;
  forceReadOnly?: boolean;
}) {
  const { canCreate, canUpdate } = useCrudPermissions(productPermissions);
  const hasRecord = Boolean(product);
  const { mode, readOnly } = resolveFormDialogMode({
    hasRecord,
    canCreate,
    canUpdate,
    forceReadOnly,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent nested={nested} className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{formDialogTitle("Product", mode)}</DialogTitle>
        </DialogHeader>
        <ProductForm
          product={product}
          disabled={readOnly}
          showCancel
          onCancel={() => onOpenChange(false)}
          onSuccess={(entity) => {
            if (!product) {
              onCreated?.(entity);
            }
            onOpenChange(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
