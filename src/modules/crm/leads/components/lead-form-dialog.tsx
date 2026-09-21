"use client";

import { LeadForm } from "@/modules/crm/leads/components/lead-form";
import { leadPermissions } from "@/modules/crm/leads/permissions";
import {
  formDialogTitle,
  resolveFormDialogMode,
  useCrudPermissions,
} from "@/shared/auth/use-crud-permissions";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";

export function LeadFormDialog({
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
  const { canCreate } = useCrudPermissions(leadPermissions);
  const { mode, readOnly } = resolveFormDialogMode({
    hasRecord: false,
    canCreate,
    canUpdate: false,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent nested={nested} className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{formDialogTitle("Lead", mode)}</DialogTitle>
        </DialogHeader>
        <LeadForm
          lead={null}
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
