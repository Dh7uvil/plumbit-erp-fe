"use client";

import { ActivityForm } from "@/modules/crm/activities/components/activity-form";
import { activityPermissions } from "@/modules/crm/activities/permissions";
import type { CrmRelatedEntityType } from "@/modules/crm/activities/schemas";
import {
  formDialogTitle,
  resolveFormDialogMode,
  useCrudPermissions,
} from "@/shared/auth/use-crud-permissions";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";

export function ActivityFormDialog({
  open,
  onOpenChange,
  related,
  relatedLocked = false,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  related?: { type: CrmRelatedEntityType; id: string };
  relatedLocked?: boolean;
  onCreated?: (entity: { id: string }) => void;
}) {
  const { canCreate } = useCrudPermissions(activityPermissions);
  const { mode, readOnly } = resolveFormDialogMode({
    hasRecord: false,
    canCreate,
    canUpdate: false,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{formDialogTitle("Activity", mode)}</DialogTitle>
        </DialogHeader>
        <ActivityForm
          related={related}
          relatedLocked={relatedLocked}
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
