"use client";

import { CampaignForm } from "@/modules/crm/campaigns/components/campaign-form";
import { campaignPermissions } from "@/modules/crm/campaigns/permissions";
import type { Campaign } from "@/modules/crm/campaigns/schemas";
import {
  formDialogTitle,
  resolveFormDialogMode,
  useCrudPermissions,
} from "@/shared/auth/use-crud-permissions";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";

export function CampaignFormDialog({
  open,
  onOpenChange,
  onCreated,
  nested = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (entity: Campaign) => void;
  nested?: boolean;
}) {
  const { canCreate } = useCrudPermissions(campaignPermissions);
  const { mode, readOnly } = resolveFormDialogMode({
    hasRecord: false,
    canCreate,
    canUpdate: false,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent nested={nested} className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{formDialogTitle("Campaign", mode)}</DialogTitle>
        </DialogHeader>
        <CampaignForm
          campaign={null}
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
