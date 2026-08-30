"use client";

import { TaxForm } from "@/modules/erp/accounting/taxes/components/tax-form";
import { taxPermissions } from "@/modules/erp/accounting/taxes/permissions";
import type { Tax } from "@/modules/erp/accounting/taxes/schemas";
import {
  formDialogTitle,
  resolveFormDialogMode,
  useCrudPermissions,
} from "@/shared/auth/use-crud-permissions";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";

export function TaxFormDialog({
  open,
  onOpenChange,
  onCreated,
  nested = false,
}: {
  open: boolean;
  tax?: Tax | null;
  onOpenChange: (open: boolean) => void;
  onCreated?: (entity: { id: string }) => void;
  nested?: boolean;
  forceReadOnly?: boolean;
}) {
  const { canCreate } = useCrudPermissions(taxPermissions);
  const { mode, readOnly } = resolveFormDialogMode({
    hasRecord: false,
    canCreate,
    canUpdate: false,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent nested={nested} className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{formDialogTitle("Tax", mode)}</DialogTitle>
        </DialogHeader>
        <TaxForm
          tax={null}
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
