"use client";

import { Button } from "@/shared/components/ui/button";
import { SubmitButton } from "@/shared/components/form/submit-button";
import { DialogFooter } from "@/shared/components/ui/dialog";

export function FormDialogFooter({
  pending,
  canSubmit,
  submitLabel,
  onClose,
}: {
  pending: boolean;
  canSubmit: boolean;
  submitLabel: string;
  onClose: () => void;
}) {
  return (
    <DialogFooter>
      <Button type="button" variant="outline" onClick={onClose} disabled={pending}>
        {canSubmit ? "Cancel" : "Close"}
      </Button>
      {canSubmit ? (
        <SubmitButton isPending={pending}>{submitLabel}</SubmitButton>
      ) : null}
    </DialogFooter>
  );
}
