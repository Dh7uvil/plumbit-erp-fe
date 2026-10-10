"use client";

import { ChargeTypeForm } from "@/modules/erp/accounting/charge-types/components/charge-type-form";
import { chargeTypePermissions } from "@/modules/erp/accounting/charge-types/permissions";
import type { ChargeType } from "@/modules/erp/accounting/charge-types/schemas";
import {
  formDialogTitle,
  resolveFormDialogMode,
  useCrudPermissions,
} from "@/shared/auth/use-crud-permissions";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";

export function ChargeTypeFormDialog({
  open,
  onOpenChange,
  chargeType,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chargeType: ChargeType | null;
  onSaved?: (entity: ChargeType) => void;
}) {
  const { canCreate, canUpdate } = useCrudPermissions(chargeTypePermissions);
  const { mode, readOnly } = resolveFormDialogMode({
    hasRecord: Boolean(chargeType),
    canCreate,
    canUpdate,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{formDialogTitle("Charge type", mode)}</DialogTitle>
        </DialogHeader>
        <ChargeTypeForm
          chargeType={chargeType}
          disabled={readOnly}
          showCancel
          onCancel={() => onOpenChange(false)}
          onSuccess={(entity) => {
            onSaved?.(entity);
            onOpenChange(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
