"use client";

import { OpportunityForm } from "@/modules/crm/opportunities/components/opportunity-form";
import { opportunityPermissions } from "@/modules/crm/opportunities/permissions";
import {
  formDialogTitle,
  resolveFormDialogMode,
  useCrudPermissions,
} from "@/shared/auth/use-crud-permissions";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";

export function OpportunityFormDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (entity: { id: string }) => void;
}) {
  const { canCreate } = useCrudPermissions(opportunityPermissions);
  const { mode, readOnly } = resolveFormDialogMode({
    hasRecord: false,
    canCreate,
    canUpdate: false,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{formDialogTitle("Opportunity", mode)}</DialogTitle>
        </DialogHeader>
        <OpportunityForm
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
