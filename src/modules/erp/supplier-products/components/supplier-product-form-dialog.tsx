"use client";

import { SupplierProductForm } from "@/modules/erp/supplier-products/components/supplier-product-form";
import { supplierProductPermissions } from "@/modules/erp/supplier-products/permissions";
import type { SupplierProduct } from "@/modules/erp/supplier-products/schemas";
import {
  formDialogTitle,
  resolveFormDialogMode,
  useCrudPermissions,
} from "@/shared/auth/use-crud-permissions";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";

export function SupplierProductFormDialog({
  open,
  supplierProduct,
  defaultSupplierId,
  defaultProductId,
  lockSupplier = false,
  lockProduct = false,
  onOpenChange,
  onCreated,
  nested = false,
  forceReadOnly = false,
}: {
  open: boolean;
  supplierProduct: SupplierProduct | null;
  defaultSupplierId?: string;
  defaultProductId?: string;
  lockSupplier?: boolean;
  lockProduct?: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (entity: SupplierProduct) => void;
  nested?: boolean;
  forceReadOnly?: boolean;
}) {
  const { canCreate, canUpdate } = useCrudPermissions(supplierProductPermissions);
  const hasRecord = Boolean(supplierProduct);
  const { mode, readOnly } = resolveFormDialogMode({
    hasRecord,
    canCreate,
    canUpdate,
    forceReadOnly,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent nested={nested} className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{formDialogTitle("catalog item", mode)}</DialogTitle>
        </DialogHeader>
        <SupplierProductForm
          supplierProduct={supplierProduct}
          defaultSupplierId={defaultSupplierId}
          defaultProductId={defaultProductId}
          lockSupplier={lockSupplier}
          lockProduct={lockProduct}
          disabled={readOnly}
          showCancel
          onCancel={() => onOpenChange(false)}
          onSuccess={(entity) => {
            if (!supplierProduct) {
              onCreated?.(entity);
            }
            onOpenChange(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
