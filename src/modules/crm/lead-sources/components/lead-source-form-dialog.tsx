"use client";

import { LeadSourceForm } from "@/modules/crm/lead-sources/components/lead-source-form";
import { leadSourcePermissions } from "@/modules/crm/lead-sources/permissions";
import type { LeadSource } from "@/modules/crm/lead-sources/schemas";
import {
  formDialogTitle,
  resolveFormDialogMode,
  useCrudPermissions,
} from "@/shared/auth/use-crud-permissions";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";

export function LeadSourceFormDialog({
  open,
  onOpenChange,
  onCreated,
  nested = false,
}: {
  open: boolean;
  source?: LeadSource | null;
  onOpenChange: (open: boolean) => void;
  onCreated?: (entity: { id: string }) => void;
  nested?: boolean;
  forceReadOnly?: boolean;
}) {
  const { canCreate } = useCrudPermissions(leadSourcePermissions);
  const { mode, readOnly } = resolveFormDialogMode({
    hasRecord: false,
    canCreate,
    canUpdate: false,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent nested={nested} className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{formDialogTitle("Lead Source", mode)}</DialogTitle>
        </DialogHeader>
        <LeadSourceForm
          source={null}
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
