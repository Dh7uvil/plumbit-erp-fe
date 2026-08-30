"use client";

import { CurrencyForm } from "@/modules/erp/currencies/components/currency-form";
import { currencyPermissions } from "@/modules/erp/currencies/permissions";
import type { Currency } from "@/modules/erp/currencies/schemas";
import {
  formDialogTitle,
  resolveFormDialogMode,
  useCrudPermissions,
} from "@/shared/auth/use-crud-permissions";
import { FormDialogHeader } from "@/shared/components/form/form-dialog-header";
import { Dialog, DialogContent } from "@/shared/components/ui/dialog";

export function CurrencyFormDialog({
  open,
  onOpenChange,
  onCreated,
  nested = false,
}: {
  open: boolean;
  currency?: Currency | null;
  onOpenChange: (open: boolean) => void;
  onCreated?: (entity: Currency) => void;
  nested?: boolean;
  forceReadOnly?: boolean;
}) {
  const { canCreate } = useCrudPermissions(currencyPermissions);
  const { mode, readOnly } = resolveFormDialogMode({
    hasRecord: false,
    canCreate,
    canUpdate: false,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent nested={nested} className="sm:max-w-xl">
        <FormDialogHeader title={formDialogTitle("Currency", mode)} entity="Currency" />
        <CurrencyForm
          currency={null}
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
