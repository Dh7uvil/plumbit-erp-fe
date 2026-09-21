"use client";

import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Search, X, Zap } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { APP_NAME } from "@/config/constants";
import {
  findActiveNav,
  searchableNavigation,
  visibleNavigation,
  type NavigationGroup,
} from "@/config/navigation";
import {
  filterCommandItems,
  groupCommandItems,
} from "@/shared/components/layout/command-palette-search";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Sheet, SheetContent, SheetTitle } from "@/shared/components/ui/sheet";
import { FOCUS_SIDEBAR_SEARCH_EVENT } from "@/shared/lib/keyboard-shortcuts";
import { cn } from "@/shared/lib/cn";
import { useSession } from "@/shared/providers/session-provider";

function filterNavigationGroups(query: string, groups: NavigationGroup[]): NavigationGroup[] {
  return groupCommandItems(filterCommandItems(query, groups)).map((section) => ({
    label: section.group,
    items: section.items.map((row) => row.item),
  }));
}

function SidebarSearch({
  value,
  onChange,
  collapsed,
  onExpand,
}: {
  value: string;
  onChange: (value: string) => void;
  collapsed: boolean;
  onExpand?: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [shouldFocus, setShouldFocus] = useState(false);

  useEffect(() => {
    if (!collapsed && shouldFocus) {
      inputRef.current?.focus();
      inputRef.current?.select();
      setShouldFocus(false);
    }
  }, [collapsed, shouldFocus]);

  useEffect(() => {
    function onFocusSearch() {
      if (collapsed) {
        setShouldFocus(true);
        onExpand?.();
        return;
      }
      inputRef.current?.focus();
      inputRef.current?.select();
    }
    window.addEventListener(FOCUS_SIDEBAR_SEARCH_EVENT, onFocusSearch);
    return () => window.removeEventListener(FOCUS_SIDEBAR_SEARCH_EVENT, onFocusSearch);
  }, [collapsed, onExpand]);

  if (collapsed) {
    return (
      <div className="flex justify-center px-1 py-2">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="text-muted-foreground"
          onClick={() => {
            setShouldFocus(true);
            onExpand?.();
          }}
          aria-label="Search pages"
        >
          <Search className="size-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="relative">
      <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2 size-3 -translate-y-1/2" />
      <Input
        ref={inputRef}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search…"
        aria-label="Search pages"
        className="bg-muted/40 h-8 pr-7 pl-7 text-sm md:text-sm"
      />
      {value ? (
        <button
          type="button"
          className="text-muted-foreground hover:text-foreground absolute top-1/2 right-1.5 -translate-y-1/2 cursor-pointer rounded-sm p-0.5"
          onClick={() => {
            onChange("");
            inputRef.current?.focus();
          }}
          aria-label="Clear search"
        >
          <X className="size-3" />
        </button>
      ) : null}
    </div>
  );
}

function SidebarNav({
  collapsed,
  groups,
  query,
  onNavigate,
}: {
  collapsed: boolean;
  groups: NavigationGroup[];
  query: string;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const active = findActiveNav(pathname);
  const activeGroupLabel = active?.group ?? null;
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [syncedPath, setSyncedPath] = useState(pathname);
  const isSearching = Boolean(query.trim());
  const displayGroups = isSearching ? filterNavigationGroups(query, groups) : groups;

  if (pathname !== syncedPath) {
    setSyncedPath(pathname);
    setOpenGroup(null);
  }

  const visibleGroup = openGroup ?? activeGroupLabel;

  function isGroupOpen(label: string) {
    if (collapsed || isSearching) {
      return true;
    }
    return visibleGroup === label;
  }

  function toggleGroup(label: string) {
    setOpenGroup((current) => {
      const currentlyOpen = (current ?? activeGroupLabel) === label;
      if (currentlyOpen) {
        return activeGroupLabel === label ? label : null;
      }
      return label;
    });
  }

  return (
    <nav
      className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain py-2"
      style={{ scrollbarWidth: "none" }}
    >
      {isSearching && displayGroups.length === 0 ? (
        <p className="text-muted-foreground px-3 py-4 text-center text-xs">
          No pages match “{query.trim()}”
        </p>
      ) : null}
      {displayGroups.map((group) => {
        const isOpen = isGroupOpen(group.label);
        const hasActive = group.items.some((item) => item.href === active?.item.href);
        return (
          <div key={group.label} className="mb-1">
            {!collapsed ? (
              <button
                type="button"
                onClick={() => {
                  if (!isSearching) {
                    toggleGroup(group.label);
                  }
                }}
                aria-expanded={isOpen}
                className={cn(
                  "flex w-full items-center justify-between px-3 py-1.5 text-xs font-semibold tracking-widest uppercase transition-colors",
                  isSearching ? "cursor-default" : "cursor-pointer",
                  hasActive
                    ? "text-primary/70"
                    : "text-muted-foreground/50 hover:text-muted-foreground",
                )}
              >
                <span>{group.label}</span>
                {isSearching ? null : isOpen ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
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
                        "focus-visible:ring-sidebar-ring relative flex w-full items-center gap-2 py-1.5 text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none",
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
                        <span className="truncate text-sm">{item.label}</span>
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
  const pathname = usePathname();
  const { permissions } = useSession();
  const [query, setQuery] = useState("");
  const [syncedPath, setSyncedPath] = useState(pathname);
  const isSearching = Boolean(query.trim());
  const groups = isSearching ? searchableNavigation(permissions) : visibleNavigation(permissions);

  if (pathname !== syncedPath) {
    setSyncedPath(pathname);
    setQuery("");
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <div
        className={cn(
          "border-sidebar-border relative flex h-14 shrink-0 items-center border-b",
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
                ? "bg-sidebar hover:text-foreground absolute top-1/2 right-0.5 z-10 flex size-5 -translate-y-1/2 items-center justify-center rounded-full border shadow-xs"
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
      <div
        className={cn(
          "border-sidebar-border bg-sidebar shrink-0 border-b",
          collapsed ? undefined : "px-3 py-2",
        )}
      >
        <SidebarSearch
          value={query}
          onChange={setQuery}
          collapsed={collapsed}
          onExpand={onToggle}
        />
      </div>
      <SidebarNav
        collapsed={collapsed}
        groups={groups}
        query={query}
        onNavigate={() => {
          setQuery("");
          onNavigate?.();
        }}
      />
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
          "bg-sidebar border-sidebar-border relative z-10 hidden h-full min-h-0 shrink-0 flex-col self-stretch overflow-hidden border-r transition-all duration-200 md:flex",
          collapsed ? "w-16" : "w-64",
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
