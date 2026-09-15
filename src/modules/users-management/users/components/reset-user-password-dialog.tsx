"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { useAdminResetUserPassword } from "@/modules/users-management/users/mutations";
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
import { Input } from "@/shared/components/ui/input";

export function ResetUserPasswordDialog({
  user,
  onOpenChange,
}: {
  user: User | null;
  onOpenChange: (open: boolean) => void;
}) {
  const resetPassword = useAdminResetUserPassword();
  const [newPassword, setNewPassword] = useState("");

  async function onConfirm() {
    if (!user) {
      return;
    }
    try {
      await resetPassword.mutateAsync({ id: user.id, newPassword });
      toast.success("Password reset");
      setNewPassword("");
      onOpenChange(false);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <AlertDialog
      open={Boolean(user)}
      onOpenChange={(open) => {
        if (!open) {
          setNewPassword("");
        }
        onOpenChange(open);
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Reset password</AlertDialogTitle>
          <AlertDialogDescription>
            Set a new password for {user ? `"${user.name}"` : "this user"}. Their existing sessions
            will be revoked.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <Input
          type="password"
          autoComplete="new-password"
          placeholder="New password"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
        />
        <AlertDialogFooter>
          <AlertDialogCancel disabled={resetPassword.isPending}>Cancel</AlertDialogCancel>
          <Button
            type="button"
            disabled={resetPassword.isPending || newPassword.length < 8}
            onClick={onConfirm}
          >
            {resetPassword.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            Reset Password
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
