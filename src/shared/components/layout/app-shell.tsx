"use client";

import { useState, type ReactNode } from "react";

import { AppHeader } from "@/modules/users-management/auth/components/app-header";
import { TenantSidebarBrand } from "@/modules/users-management/tenants/components/tenant-sidebar-brand";
import { AppKeyboardShortcuts } from "@/shared/components/layout/app-keyboard-shortcuts";
import { BreadcrumbRecordProvider } from "@/shared/components/layout/breadcrumb-record";
import { CommandPalette } from "@/shared/components/layout/command-palette";
import { HelpDialog } from "@/shared/components/layout/help-dialog";
import { MainScrollManager } from "@/shared/components/layout/main-scroll-manager";
import { AppSidebar } from "@/shared/components/layout/app-sidebar";
import { useIsClient } from "@/shared/hooks/use-is-client";

const SIDEBAR_KEY = "plumbit-sidebar-collapsed";

export function AppShell({ children }: { children: ReactNode }) {
  const isClient = useIsClient();
  const [collapsed, setCollapsed] = useState(false);
  const [sidebarLoaded, setSidebarLoaded] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  if (isClient && !sidebarLoaded) {
    setSidebarLoaded(true);
    setCollapsed(window.localStorage.getItem(SIDEBAR_KEY) === "true");
  }

  function toggleCollapsed() {
    setCollapsed((value) => {
      const next = !value;
      window.localStorage.setItem(SIDEBAR_KEY, String(next));
      return next;
    });
  }

  return (
    <BreadcrumbRecordProvider>
      <div className="flex h-svh max-h-svh min-h-0 overflow-hidden">
        <a
          href="#main-content"
          className="bg-primary text-primary-foreground sr-only z-50 focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:rounded-md focus:px-3 focus:py-2"
        >
          Skip to main content
        </a>
        <AppSidebar
          collapsed={collapsed}
          onToggle={toggleCollapsed}
          mobileOpen={mobileOpen}
          onMobileOpenChange={setMobileOpen}
          brand={(isCollapsed) => <TenantSidebarBrand collapsed={isCollapsed} />}
        />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <AppHeader
            onMobileMenuOpen={() => setMobileOpen(true)}
            onSearchOpen={() => setSearchOpen(true)}
            onHelpOpen={() => setHelpOpen(true)}
          />
          <main
            id="main-content"
            className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain p-4 md:p-6 [scroll-padding-top:6rem] [scroll-padding-bottom:2rem]"
          >
            <div className="w-full min-h-min">{children}</div>
            <MainScrollManager />
          </main>
        </div>
      </div>
      <AppKeyboardShortcuts
        searchOpen={searchOpen}
        onSearchOpenChange={setSearchOpen}
        helpOpen={helpOpen}
        onHelpOpenChange={setHelpOpen}
        onToggleSidebar={toggleCollapsed}
      />
      <CommandPalette open={searchOpen} onOpenChange={setSearchOpen} />
      <HelpDialog open={helpOpen} onOpenChange={setHelpOpen} />
    </BreadcrumbRecordProvider>
  );
}
