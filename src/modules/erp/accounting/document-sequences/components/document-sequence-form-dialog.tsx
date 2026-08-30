"use client";

import { DocumentSequenceForm } from "@/modules/erp/accounting/document-sequences/components/document-sequence-form";
import { documentSequencePermissions } from "@/modules/erp/accounting/document-sequences/permissions";
import type { DocumentSequence } from "@/modules/erp/accounting/document-sequences/schemas";
import {
  formDialogTitle,
  resolveFormDialogMode,
  useCrudPermissions,
} from "@/shared/auth/use-crud-permissions";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";

export function DocumentSequenceFormDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  sequence?: DocumentSequence | null;
  onOpenChange: (open: boolean) => void;
  forceReadOnly?: boolean;
}) {
  const { canCreate } = useCrudPermissions(documentSequencePermissions);
  const { mode, readOnly } = resolveFormDialogMode({
    hasRecord: false,
    canCreate,
    canUpdate: false,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{formDialogTitle("Document Sequence", mode)}</DialogTitle>
        </DialogHeader>
        <DocumentSequenceForm
          sequence={null}
          disabled={readOnly}
          showCancel
          onCancel={() => onOpenChange(false)}
          onSuccess={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
