"use client";

import { Loader2 } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
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
        <Button type="submit" disabled={pending}>
          {pending ? <Loader2 className="size-4 animate-spin" /> : null}
          {submitLabel}
        </Button>
      ) : null}
    </DialogFooter>
  );
}
