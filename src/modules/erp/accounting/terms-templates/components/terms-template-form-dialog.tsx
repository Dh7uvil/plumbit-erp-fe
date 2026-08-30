"use client";

import { TermsTemplateForm } from "@/modules/erp/accounting/terms-templates/components/terms-template-form";
import { termsTemplatePermissions } from "@/modules/erp/accounting/terms-templates/permissions";
import type { TermsTemplate } from "@/modules/erp/accounting/terms-templates/schemas";
import {
  formDialogTitle,
  resolveFormDialogMode,
  useCrudPermissions,
} from "@/shared/auth/use-crud-permissions";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";

export function TermsTemplateFormDialog({
  open,
  onOpenChange,
  onCreated,
  nested = false,
}: {
  open: boolean;
  template?: TermsTemplate | null;
  onOpenChange: (open: boolean) => void;
  onCreated?: (entity: { id: string }) => void;
  nested?: boolean;
  forceReadOnly?: boolean;
}) {
  const { canCreate } = useCrudPermissions(termsTemplatePermissions);
  const { mode, readOnly } = resolveFormDialogMode({
    hasRecord: false,
    canCreate,
    canUpdate: false,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent nested={nested} className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{formDialogTitle("Terms Template", mode)}</DialogTitle>
        </DialogHeader>
        <TermsTemplateForm
          template={null}
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
