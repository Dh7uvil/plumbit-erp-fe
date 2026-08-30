"use client";

import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  HelpCircle,
  X,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";

import { APP_NAME } from "@/config/constants";
import { findActiveNav, visibleNavigation } from "@/config/navigation";
import { useSession } from "@/shared/providers/session-provider";
import { Sheet, SheetContent, SheetTitle } from "@/shared/components/ui/sheet";
import { cn } from "@/shared/lib/cn";

function SidebarNav({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();
  const { permissions } = useSession();
  const groups = visibleNavigation(permissions);
  const active = findActiveNav(pathname);

  const [toggledGroups, setToggledGroups] = useState<Record<string, boolean>>({});

  function isGroupOpen(label: string) {
    if (collapsed) {
      return true;
    }
    if (label in toggledGroups) {
      return toggledGroups[label];
    }
    return true;
  }

  return (
    <nav className="flex-1 overflow-y-auto py-2" style={{ scrollbarWidth: "none" }}>
      {groups.map((group) => {
        const isOpen = isGroupOpen(group.label);
        const hasActive = group.items.some((item) => item.href === active?.item.href);
        return (
          <div key={group.label} className="mb-1">
            {!collapsed ? (
              <button
                type="button"
                onClick={() =>
                  setToggledGroups((prev) => ({
                    ...prev,
                    [group.label]: !isOpen,
                  }))
                }
                className={cn(
                  "flex w-full cursor-pointer items-center justify-between px-3 py-1.5 text-[10px] font-semibold tracking-widest uppercase transition-colors",
                  hasActive
                    ? "text-primary/70"
                    : "text-muted-foreground/50 hover:text-muted-foreground",
                )}
              >
                <span>{group.label}</span>
                {isOpen ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
              </button>
            ) : (
              <div className="border-sidebar-border mx-2 my-1 border-t" />
            )}
            {isOpen
              ? group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = active?.item.href === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      title={collapsed ? item.label : undefined}
                      onClick={onNavigate}
                      className={cn(
                        "relative flex w-full items-center gap-2 py-1.5 text-sm transition-colors focus-visible:outline-none",
                        collapsed ? "justify-center px-0" : "px-3",
                        isActive
                          ? "bg-sidebar-accent text-sidebar-primary font-medium"
                          : "text-sidebar-foreground/75 hover:bg-muted/60 hover:text-sidebar-foreground",
                      )}
                    >
                      {isActive ? (
                        <span className="bg-primary absolute top-1.5 bottom-1.5 left-0 w-0.5 rounded-full" />
                      ) : null}
                      <Icon
                        size={15}
                        className={isActive ? "text-primary" : "text-muted-foreground"}
                      />
                      {!collapsed ? (
                        <span className="truncate text-[13px]">{item.label}</span>
                      ) : null}
                    </Link>
                  );
                })
              : null}
          </div>
        );
      })}
    </nav>
  );
}

function SidebarChrome({
  collapsed,
  brand,
  onToggle,
  onClose,
  onNavigate,
}: {
  collapsed: boolean;
  brand?: ReactNode;
  onToggle?: () => void;
  onClose?: () => void;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-1 flex-col">
      <div
        className={cn(
          "border-sidebar-border relative flex h-12 shrink-0 items-center border-b",
          collapsed ? "justify-center px-1" : "gap-2.5 px-3",
        )}
      >
        {brand ?? (
          <>
            <div
              className={cn(
                "bg-primary flex shrink-0 items-center justify-center overflow-hidden rounded-lg",
                collapsed ? "size-8" : "size-7",
              )}
            >
              <Zap size={collapsed ? 16 : 14} className="text-white" />
            </div>
            {!collapsed ? (
              <span className="text-foreground truncate text-sm font-semibold tracking-tight">
                {APP_NAME}
              </span>
            ) : null}
          </>
        )}
        {onToggle ? (
          <button
            type="button"
            onClick={onToggle}
            className={cn(
              "text-muted-foreground hover:bg-muted cursor-pointer rounded p-1 transition-colors",
              collapsed
                ? "bg-sidebar hover:text-foreground absolute top-1/2 -right-2.5 z-10 flex size-5 -translate-y-1/2 items-center justify-center rounded-full border shadow-xs"
                : "ml-auto",
            )}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={14} />}
          </button>
        ) : null}
        {onClose && !onToggle ? (
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:bg-muted ml-auto cursor-pointer rounded p-1"
            aria-label="Close menu"
          >
            <X size={14} />
          </button>
        ) : null}
      </div>
      <SidebarNav collapsed={collapsed} onNavigate={onNavigate} />
      <div
        className={cn(
          "border-sidebar-border flex shrink-0 flex-col gap-0.5 border-t px-2 py-2",
          collapsed && "items-center",
        )}
      >
        <span
          className={cn(
            "text-muted-foreground flex items-center gap-2 px-2 py-1.5 text-xs",
            collapsed && "justify-center",
          )}
        >
          <HelpCircle size={14} />
          {!collapsed ? "Help & Support" : null}
        </span>
      </div>
    </div>
  );
}

export function AppSidebar({
  collapsed,
  onToggle,
  mobileOpen,
  onMobileOpenChange,
  brand,
}: {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileOpenChange: (open: boolean) => void;
  brand?: (collapsed: boolean) => ReactNode;
}) {
  return (
    <>
      <aside
        className={cn(
          "bg-sidebar border-sidebar-border relative z-10 hidden min-h-screen shrink-0 flex-col self-stretch overflow-visible border-r transition-all duration-200 md:flex",
          collapsed ? "w-14" : "w-56",
        )}
      >
        <SidebarChrome collapsed={collapsed} onToggle={onToggle} brand={brand?.(collapsed)} />
      </aside>
      <Sheet open={mobileOpen} onOpenChange={onMobileOpenChange}>
        <SheetContent side="left" className="bg-sidebar w-64 p-0 sm:max-w-64">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SidebarChrome
            collapsed={false}
            onClose={() => onMobileOpenChange(false)}
            onNavigate={() => onMobileOpenChange(false)}
            brand={brand?.(false)}
          />
        </SheetContent>
      </Sheet>
    </>
  );
}
