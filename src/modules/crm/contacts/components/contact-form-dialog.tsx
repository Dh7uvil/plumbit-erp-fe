"use client";

import { ContactForm } from "@/modules/crm/contacts/components/contact-form";
import { contactPermissions } from "@/modules/crm/contacts/permissions";
import type { Contact } from "@/modules/crm/contacts/schemas";
import {
  formDialogTitle,
  resolveFormDialogMode,
  useCrudPermissions,
} from "@/shared/auth/use-crud-permissions";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";

export function ContactFormDialog({
  open,
  defaultCustomerId,
  lockCustomer = false,
  defaultIsPrimary = false,
  onOpenChange,
  onCreated,
  nested = false,
}: {
  open: boolean;
  contact?: Contact | null;
  defaultCustomerId?: string;
  lockCustomer?: boolean;
  defaultIsPrimary?: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (entity: { id: string }) => void;
  nested?: boolean;
  forceReadOnly?: boolean;
}) {
  const { canCreate } = useCrudPermissions(contactPermissions);
  const { mode, readOnly } = resolveFormDialogMode({
    hasRecord: false,
    canCreate,
    canUpdate: false,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent nested={nested} className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{formDialogTitle("Contact", mode)}</DialogTitle>
        </DialogHeader>
        <ContactForm
          contact={null}
          defaultCustomerId={defaultCustomerId}
          lockCustomer={lockCustomer}
          defaultIsPrimary={defaultIsPrimary}
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
