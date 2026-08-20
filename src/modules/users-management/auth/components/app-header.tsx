"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";

import { APP_NAME } from "@/config/constants";
import { ChangePasswordDialog } from "@/modules/users-management/auth/components/change-password-dialog";
import { useLogout } from "@/modules/users-management/auth/mutations";
import { useMe } from "@/modules/users-management/auth/queries";
import { Button } from "@/shared/components/ui/button";

export function AppHeader() {
  const { data: me } = useMe();
  const logout = useLogout();
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);

  return (
    <header className="bg-card border-border flex h-14 items-center justify-between border-b px-4">
      <p className="text-sm font-semibold tracking-tight">{APP_NAME}</p>
      <div className="flex items-center gap-3">
        <p className="text-muted-foreground text-sm">{me?.name ?? "…"}</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setChangePasswordOpen(true)}
        >
          Change password
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => logout.mutate()}
          disabled={logout.isPending}
        >
          {logout.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
          Sign out
        </Button>
        <ChangePasswordDialog open={changePasswordOpen} onOpenChange={setChangePasswordOpen} />
      </div>
    </header>
  );
}
