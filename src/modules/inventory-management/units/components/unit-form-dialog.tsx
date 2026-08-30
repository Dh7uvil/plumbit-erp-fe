"use client";

import { UnitForm } from "@/modules/inventory-management/units/components/unit-form";
import { unitPermissions } from "@/modules/inventory-management/units/permissions";
import {
  formDialogTitle,
  resolveFormDialogMode,
  useCrudPermissions,
} from "@/shared/auth/use-crud-permissions";
import { FormDialogHeader } from "@/shared/components/form/form-dialog-header";
import { Dialog, DialogContent } from "@/shared/components/ui/dialog";

export function UnitFormDialog({
  open,
  onOpenChange,
  onCreated,
  nested = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (entity: { id: string }) => void;
  nested?: boolean;
}) {
  const { canCreate } = useCrudPermissions(unitPermissions);
  const { mode, readOnly } = resolveFormDialogMode({
    hasRecord: false,
    canCreate,
    canUpdate: false,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent nested={nested} className="sm:max-w-lg">
        <FormDialogHeader title={formDialogTitle("Unit", mode)} entity="Unit" />
        <UnitForm
          unit={null}
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
