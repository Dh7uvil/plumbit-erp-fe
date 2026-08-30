"use client";

import { SupplierForm } from "@/modules/erp/suppliers/components/supplier-form";
import type { Supplier } from "@/modules/erp/suppliers/schemas";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";

export function SupplierFormDialog({
  open,
  supplier,
  onOpenChange,
}: {
  open: boolean;
  supplier: Supplier | null;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{supplier ? "Edit Supplier" : "New Supplier"}</DialogTitle>
        </DialogHeader>
        <SupplierForm
          supplier={supplier}
          showCancel
          onCancel={() => onOpenChange(false)}
          onSuccess={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
