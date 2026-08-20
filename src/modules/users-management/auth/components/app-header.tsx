"use client";

import { ChevronRight, KeyRound, LogOut, Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { findActiveNav } from "@/config/navigation";
import { ChangePasswordDialog } from "@/modules/users-management/auth/components/change-password-dialog";
import { useLogout } from "@/modules/users-management/auth/mutations";
import { useMe } from "@/modules/users-management/auth/queries";
import { Avatar, AvatarFallback } from "@/shared/components/ui/avatar";
import { Button } from "@/shared/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { initials } from "@/shared/lib/format";

export function AppHeader({ onMobileMenuOpen }: { onMobileMenuOpen: () => void }) {
  const pathname = usePathname();
  const { data: me } = useMe();
  const logout = useLogout();
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const active = findActiveNav(pathname);

  return (
    <header className="bg-card border-border flex h-12 shrink-0 items-center gap-2 border-b px-3 md:gap-3 md:px-4">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-8 md:hidden"
        onClick={onMobileMenuOpen}
        aria-label="Open navigation"
      >
        <Menu className="size-4" />
      </Button>
      <nav className="hidden min-w-0 items-center gap-1.5 text-xs sm:flex" aria-label="Breadcrumb">
        <span className="text-muted-foreground/60 truncate">{active?.group ?? "Overview"}</span>
        <ChevronRight size={11} className="text-muted-foreground/40 shrink-0" />
        <span className="text-foreground truncate font-medium">
          {active?.item.label ?? "Dashboard"}
        </span>
      </nav>
      <div className="flex-1" />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            className="h-8 gap-1.5 px-1.5 md:gap-2"
            aria-label={me?.name ? `Account menu for ${me.name}` : "Account menu"}
          >
            <Avatar className="size-7">
              <AvatarFallback className="bg-primary text-[10px] text-white">
                {me?.name ? initials(me.name) : "…"}
              </AvatarFallback>
            </Avatar>
            <span className="hidden flex-col items-start leading-none md:flex">
              <span className="text-foreground text-xs font-medium">{me?.name ?? "…"}</span>
              <span className="text-muted-foreground text-[10px]">{me?.email ?? ""}</span>
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="font-normal">
            <p className="text-sm font-medium">{me?.name ?? "…"}</p>
            <p className="text-muted-foreground text-xs">{me?.email ?? ""}</p>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => setChangePasswordOpen(true)}>
            <KeyRound />
            Change password
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            disabled={logout.isPending}
            onSelect={() => logout.mutate()}
          >
            <LogOut />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ChangePasswordDialog open={changePasswordOpen} onOpenChange={setChangePasswordOpen} />
    </header>
  );
}
