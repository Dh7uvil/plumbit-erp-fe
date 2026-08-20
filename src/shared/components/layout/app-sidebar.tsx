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
import { useState } from "react";

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
    return label === active?.group;
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
                  "flex w-full items-center justify-between px-3 py-1.5 text-[10px] font-semibold tracking-widest uppercase transition-colors",
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
  onToggle,
  onClose,
  onNavigate,
}: {
  collapsed: boolean;
  onToggle?: () => void;
  onClose?: () => void;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-1 flex-col">
      <div
        className={cn(
          "border-sidebar-border flex h-12 shrink-0 items-center gap-2.5 border-b px-3",
          collapsed && "justify-center",
        )}
      >
        <div className="bg-primary flex size-7 shrink-0 items-center justify-center rounded-lg">
          <Zap size={14} className="text-white" />
        </div>
        {!collapsed ? (
          <span className="text-foreground truncate text-sm font-semibold tracking-tight">
            {APP_NAME}
          </span>
        ) : null}
        {onToggle ? (
          <button
            type="button"
            onClick={onToggle}
            className={cn(
              "text-muted-foreground hover:bg-muted rounded p-1 transition-colors",
              collapsed ? "ml-0" : "ml-auto",
            )}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        ) : null}
        {onClose && !onToggle ? (
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:bg-muted ml-auto rounded p-1"
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
}: {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileOpenChange: (open: boolean) => void;
}) {
  return (
    <>
      <aside
        className={cn(
          "bg-sidebar border-sidebar-border hidden min-h-screen shrink-0 flex-col self-stretch border-r transition-all duration-200 md:flex",
          collapsed ? "w-14" : "w-56",
        )}
      >
        <SidebarChrome collapsed={collapsed} onToggle={onToggle} />
      </aside>
      <Sheet open={mobileOpen} onOpenChange={onMobileOpenChange}>
        <SheetContent side="left" className="bg-sidebar w-64 p-0 sm:max-w-64">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SidebarChrome
            collapsed={false}
            onClose={() => onMobileOpenChange(false)}
            onNavigate={() => onMobileOpenChange(false)}
          />
        </SheetContent>
      </Sheet>
    </>
  );
}
