"use client";

import { Bell, KeyRound, LogOut, Menu, Moon, Search, Sun, User } from "lucide-react";
import Link from "next/link";

import { AppBreadcrumb } from "@/shared/components/layout/app-breadcrumb";
import { CommandSearchTrigger } from "@/shared/components/layout/command-search-trigger";
import { HelpTrigger } from "@/shared/components/layout/help-dialog";
import { useTheme } from "@/shared/components/layout/theme-provider";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip";
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

export function AppHeader({
  onMobileMenuOpen,
  onSearchOpen,
  onHelpOpen,
}: {
  onMobileMenuOpen: () => void;
  onSearchOpen: () => void;
  onHelpOpen: () => void;
}) {
  const { data: me } = useMe();
  const logout = useLogout();
  const { theme, toggleTheme } = useTheme();
  const themeTooltip = theme === "dark" ? "Light mode" : "Dark mode";

  return (
    <TooltipProvider>
      <header className="bg-card border-border flex h-14 shrink-0 items-center gap-2 border-b px-3 md:gap-3 md:px-4">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="md:hidden"
          onClick={onMobileMenuOpen}
          aria-label="Open navigation"
        >
          <Menu className="size-4" />
        </Button>
        <AppBreadcrumb />
        <div className="flex-1" />
        <CommandSearchTrigger onOpen={onSearchOpen} className="hidden w-44 md:inline-flex" />
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="text-muted-foreground md:hidden"
          onClick={onSearchOpen}
          aria-label="Search pages"
        >
          <Search className="size-4" />
        </Button>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground"
              onClick={toggleTheme}
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {theme === "dark" ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>{themeTooltip}</TooltipContent>
        </Tooltip>
        <HelpTrigger onClick={onHelpOpen} />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              className="h-8 gap-1.5 px-1.5 md:gap-2"
              aria-label={me?.name ? `Account menu for ${me.name}` : "Account menu"}
            >
              <Avatar className="size-7">
                <AvatarFallback className="bg-primary text-xs text-white">
                  {me?.name ? initials(me.name) : "…"}
                </AvatarFallback>
              </Avatar>
              <span className="hidden flex-col items-start leading-none md:flex">
                <span className="text-foreground text-xs font-medium">{me?.name ?? "…"}</span>
                <span className="text-muted-foreground text-xs">{me?.email ?? ""}</span>
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <p className="text-sm font-medium">{me?.name ?? "…"}</p>
              <p className="text-muted-foreground text-xs">{me?.email ?? ""}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings/profile">
                <User />
                My profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings/password">
                <KeyRound />
                Change password
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings/notifications">
                <Bell />
                Notifications
              </Link>
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
      </header>
    </TooltipProvider>
  );
}
