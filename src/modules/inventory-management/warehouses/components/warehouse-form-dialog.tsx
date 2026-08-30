"use client";

import { WarehouseForm } from "@/modules/inventory-management/warehouses/components/warehouse-form";
import { warehousePermissions } from "@/modules/inventory-management/warehouses/permissions";
import type { Warehouse } from "@/modules/inventory-management/warehouses/schemas";
import {
  formDialogTitle,
  resolveFormDialogMode,
  useCrudPermissions,
} from "@/shared/auth/use-crud-permissions";
import { FormDialogHeader } from "@/shared/components/form/form-dialog-header";
import { Dialog, DialogContent } from "@/shared/components/ui/dialog";

export function WarehouseFormDialog({
  open,
  onOpenChange,
  onCreated,
  nested = false,
}: {
  open: boolean;
  warehouse?: Warehouse | null;
  onOpenChange: (open: boolean) => void;
  onCreated?: (entity: { id: string }) => void;
  nested?: boolean;
  forceReadOnly?: boolean;
}) {
  const { canCreate } = useCrudPermissions(warehousePermissions);
  const { mode, readOnly } = resolveFormDialogMode({
    hasRecord: false,
    canCreate,
    canUpdate: false,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent nested={nested} className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <FormDialogHeader title={formDialogTitle("Warehouse", mode)} entity="Warehouse" />
        <WarehouseForm
          warehouse={null}
          disabled={readOnly}
          showCancel
          onCancel={() => onOpenChange(false)}
          onSuccess={(entity) => {
            onCreated?.(entity);
            onOpenChange(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
