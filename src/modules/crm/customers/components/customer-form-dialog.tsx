"use client";

import type { CreatedParty } from "@/modules/crm/contacts/schemas";
import { CustomerForm } from "@/modules/crm/customers/components/customer-form";
import { customerPermissions } from "@/modules/crm/customers/permissions";
import type { Customer } from "@/modules/crm/customers/schemas";
import {
  formDialogTitle,
  resolveFormDialogMode,
  useCrudPermissions,
} from "@/shared/auth/use-crud-permissions";
import { FormDialogHeader } from "@/shared/components/form/form-dialog-header";
import { Dialog, DialogContent } from "@/shared/components/ui/dialog";

export function CustomerFormDialog({
  open,
  customer,
  onOpenChange,
  onCreated,
  nested = false,
  forceReadOnly = false,
}: {
  open: boolean;
  customer: Customer | null;
  onOpenChange: (open: boolean) => void;
  onCreated?: (entity: CreatedParty) => void;
  nested?: boolean;
  forceReadOnly?: boolean;
}) {
  const { canCreate, canUpdate } = useCrudPermissions(customerPermissions);
  const hasRecord = Boolean(customer);
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
          title={formDialogTitle("Customer", mode)}
          entity="Customer"
          code={customer?.code}
        />
        <CustomerForm
          customer={customer}
          disabled={readOnly}
          showCancel
          onCancel={() => onOpenChange(false)}
          onSuccess={(entity) => {
            if (!customer) {
              onCreated?.(entity);
            }
            onOpenChange(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
