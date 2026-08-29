"use client";

import { useState, type ReactNode } from "react";

import { AppHeader } from "@/modules/users-management/auth/components/app-header";
import { TenantSidebarBrand } from "@/modules/users-management/tenants/components/tenant-sidebar-brand";
import { AppSidebar } from "@/shared/components/layout/app-sidebar";

export function AppShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen items-stretch">
      <AppSidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((value) => !value)}
        mobileOpen={mobileOpen}
        onMobileOpenChange={setMobileOpen}
        brand={(isCollapsed) => <TenantSidebarBrand collapsed={isCollapsed} />}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader onMobileMenuOpen={() => setMobileOpen(true)} />
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
