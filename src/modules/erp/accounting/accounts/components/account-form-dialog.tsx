"use client";

import { AccountForm } from "@/modules/erp/accounting/accounts/components/account-form";
import { accountPermissions } from "@/modules/erp/accounting/accounts/permissions";
import type { Account } from "@/modules/erp/accounting/accounts/schemas";
import {
  formDialogTitle,
  resolveFormDialogMode,
  useCrudPermissions,
} from "@/shared/auth/use-crud-permissions";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";

export function AccountFormDialog({
  open,
  account,
  onOpenChange,
  onCreated,
  nested = false,
  forceReadOnly = false,
}: {
  open: boolean;
  account: Account | null;
  onOpenChange: (open: boolean) => void;
  onCreated?: (entity: Account) => void;
  nested?: boolean;
  forceReadOnly?: boolean;
}) {
  const { canCreate, canUpdate } = useCrudPermissions(accountPermissions);
  const hasRecord = Boolean(account);
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
          <DialogTitle>{formDialogTitle("account", mode)}</DialogTitle>
        </DialogHeader>
        <AccountForm
          account={account}
          disabled={readOnly}
          showCancel
          onCancel={() => onOpenChange(false)}
          onSuccess={(entity) => {
            if (!account) {
              onCreated?.(entity);
            }
            onOpenChange(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
