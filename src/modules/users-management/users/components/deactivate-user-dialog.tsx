"use client";

import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { useDeactivateUser } from "@/modules/users-management/users/mutations";
import type { User } from "@/modules/users-management/users/schemas";
import { getErrorMessage } from "@/shared/api/errors";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/components/ui/alert-dialog";
import { Button } from "@/shared/components/ui/button";

export function DeactivateUserDialog({
  user,
  onOpenChange,
}: {
  user: User | null;
  onOpenChange: (open: boolean) => void;
}) {
  const deactivate = useDeactivateUser();

  async function onConfirm() {
    if (!user) {
      return;
    }
    try {
      await deactivate.mutateAsync(user.id);
      toast.success("User deactivated");
      onOpenChange(false);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <AlertDialog open={Boolean(user)} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Deactivate user</AlertDialogTitle>
          <AlertDialogDescription>
            Deactivate {user ? `"${user.name}"` : "this user"}? They will no longer be able to sign
            in. This does not delete the account.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deactivate.isPending}>Cancel</AlertDialogCancel>
          <Button
            type="button"
            variant="destructive"
            disabled={deactivate.isPending}
            onClick={onConfirm}
          >
            {deactivate.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            Deactivate
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
