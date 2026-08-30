"use client";

import type { CreatedParty } from "@/modules/crm/contacts/schemas";
import { SupplierForm } from "@/modules/erp/suppliers/components/supplier-form";
import { supplierPermissions } from "@/modules/erp/suppliers/permissions";
import type { Supplier } from "@/modules/erp/suppliers/schemas";
import {
  formDialogTitle,
  resolveFormDialogMode,
  useCrudPermissions,
} from "@/shared/auth/use-crud-permissions";
import { FormDialogHeader } from "@/shared/components/form/form-dialog-header";
import { Dialog, DialogContent } from "@/shared/components/ui/dialog";

export function SupplierFormDialog({
  open,
  supplier,
  onOpenChange,
  onCreated,
  nested = false,
  forceReadOnly = false,
}: {
  open: boolean;
  supplier: Supplier | null;
  onOpenChange: (open: boolean) => void;
  onCreated?: (entity: CreatedParty) => void;
  nested?: boolean;
  forceReadOnly?: boolean;
}) {
  const { canCreate, canUpdate } = useCrudPermissions(supplierPermissions);
  const hasRecord = Boolean(supplier);
  const { mode, readOnly } = resolveFormDialogMode({
    hasRecord,
    canCreate,
    canUpdate,
    forceReadOnly,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent nested={nested} className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
        <FormDialogHeader
          title={formDialogTitle("Supplier", mode)}
          entity="Supplier"
          code={supplier?.code}
        />
        <SupplierForm
          supplier={supplier}
          disabled={readOnly}
          showCancel
          onCancel={() => onOpenChange(false)}
          onSuccess={(entity) => {
            if (!supplier) {
              onCreated?.(entity);
            }
            onOpenChange(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
