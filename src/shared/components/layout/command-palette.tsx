"use client";

import { ArrowRight, Clock, Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { visibleNavigation, type NavigationGroup } from "@/config/navigation";
import {
  filterCommandItems,
  groupCommandItems,
  type CommandPaletteItem,
} from "@/shared/components/layout/command-palette-search";
import { useSession } from "@/shared/providers/session-provider";

const RECENT_KEY = "plumbit-command-recent";
const MAX_RECENT = 6;

type RecentEntry = { href: string; label: string; group: string };

function readRecent(): RecentEntry[] {
  try {
    const raw = window.localStorage.getItem(RECENT_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter(
      (entry): entry is RecentEntry =>
        Boolean(entry) &&
        typeof entry === "object" &&
        typeof (entry as RecentEntry).href === "string" &&
        typeof (entry as RecentEntry).label === "string" &&
        typeof (entry as RecentEntry).group === "string",
    );
  } catch {
    return [];
  }
}

function writeRecent(entry: RecentEntry) {
  const next = [entry, ...readRecent().filter((item) => item.href !== entry.href)].slice(
    0,
    MAX_RECENT,
  );
  window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
}

export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!open) {
    return null;
  }

  return <CommandPaletteDialog onOpenChange={onOpenChange} />;
}

function CommandPaletteDialog({ onOpenChange }: { onOpenChange: (open: boolean) => void }) {
  const router = useRouter();
  const { permissions } = useSession();
  const groups = visibleNavigation(permissions);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [recent] = useState(readRecent);

  const results = useMemo(() => filterCommandItems(query, groups), [groups, query]);
  const grouped = useMemo(() => groupCommandItems(results), [results]);
  const flat = results;
  const indexByHref = useMemo(
    () => new Map(flat.map((row, index) => [row.item.href, index])),
    [flat],
  );

  const goTo = useCallback(
    (row: CommandPaletteItem | RecentEntry) => {
      const href = "item" in row ? row.item.href : row.href;
      const label = "item" in row ? row.item.label : row.label;
      const group = row.group;
      writeRecent({ href, label, group });
      onOpenChange(false);
      router.push(href);
    },
    [onOpenChange, router],
  );

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onOpenChange(false);
        return;
      }
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveIndex((index) => Math.min(index + 1, Math.max(flat.length - 1, 0)));
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex((index) => Math.max(index - 1, 0));
        return;
      }
      if (event.key === "Enter") {
        const selected = flat[activeIndex];
        if (selected) {
          event.preventDefault();
          goTo(selected);
        }
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeIndex, flat, goTo, onOpenChange]);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-16">
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        aria-label="Close search"
        onClick={() => onOpenChange(false)}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search pages"
        className="bg-popover border-border relative w-full max-w-xl overflow-hidden rounded-xl border shadow-md"
      >
        <div className="border-border flex items-center gap-3 border-b px-4 py-3">
          <Search size={16} className="text-muted-foreground shrink-0" aria-hidden="true" />
          <input
            value={query}
            autoFocus
            onChange={(event) => {
              setQuery(event.target.value);
              setActiveIndex(0);
            }}
            placeholder="Search pages…"
            className="placeholder:text-muted-foreground text-foreground flex-1 bg-transparent text-sm outline-none"
            aria-label="Search pages"
          />
          {query ? (
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground cursor-pointer"
              onClick={() => {
                setQuery("");
                setActiveIndex(0);
              }}
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          ) : null}
          <kbd className="bg-muted text-muted-foreground border-border rounded border px-1.5 py-0.5 text-[10px]">
            ESC
          </kbd>
        </div>
        <CommandPaletteBody
          query={query}
          grouped={grouped}
          flat={flat}
          indexByHref={indexByHref}
          activeIndex={activeIndex}
          recent={recent}
          groups={groups}
          onHover={setActiveIndex}
          onSelect={goTo}
        />
      </div>
    </div>
  );
}

function CommandPaletteBody({
  query,
  grouped,
  flat,
  indexByHref,
  activeIndex,
  recent,
  groups,
  onHover,
  onSelect,
}: {
  query: string;
  grouped: ReturnType<typeof groupCommandItems>;
  flat: CommandPaletteItem[];
  indexByHref: Map<string, number>;
  activeIndex: number;
  recent: RecentEntry[];
  groups: NavigationGroup[];
  onHover: (index: number) => void;
  onSelect: (row: CommandPaletteItem | RecentEntry) => void;
}) {
  const browse = groups.flatMap((group) => group.items).slice(0, 6);

  if (!query.trim()) {
    return (
      <div className="space-y-3 p-4">
        {recent.length > 0 ? (
          <div>
            <p className="text-muted-foreground mb-2 text-xs font-semibold tracking-wider uppercase">
              Recent
            </p>
            <div className="flex flex-col gap-0.5">
              {recent.map((entry) => (
                <button
                  key={entry.href}
                  type="button"
                  onClick={() => onSelect(entry)}
                  className="hover:bg-muted flex w-full cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-left transition-colors"
                >
                  <Clock size={12} className="text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground text-sm">{entry.label}</span>
                  <span className="text-muted-foreground/70 ml-auto text-[11px]">
                    {entry.group}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : null}
        <div>
          <p className="text-muted-foreground mb-2 text-xs font-semibold tracking-wider uppercase">
            Browse
          </p>
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
            {browse.map((item) => {
              const Icon = item.icon;
              const group = groups.find((entry) =>
                entry.items.some((nav) => nav.href === item.href),
              );
              return (
                <button
                  key={item.href}
                  type="button"
                  onClick={() => onSelect({ group: group?.label ?? "", item })}
                  className="border-border hover:bg-muted text-foreground flex items-center gap-1.5 rounded-md border px-2.5 py-2 text-xs transition-colors"
                >
                  <Icon size={13} className="text-muted-foreground" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  if (flat.length === 0) {
    return (
      <p className="text-muted-foreground py-8 text-center text-sm">No pages match “{query}”</p>
    );
  }

  return (
    <>
      <div className="max-h-80 overflow-y-auto py-1">
        {grouped.map((section) => (
          <div key={section.group}>
            <div className="text-muted-foreground/60 px-4 py-1.5 text-[10px] font-semibold tracking-widest uppercase">
              {section.group}
            </div>
            {section.items.map((row) => {
              const Icon = row.item.icon;
              const flatIndex = indexByHref.get(row.item.href) ?? 0;
              const active = flatIndex === activeIndex;
              return (
                <button
                  key={row.item.href}
                  type="button"
                  onMouseEnter={() => onHover(flatIndex)}
                  onClick={() => onSelect(row)}
                  className={
                    active
                      ? "bg-muted text-foreground flex w-full items-center gap-3 px-4 py-2 text-left"
                      : "text-foreground hover:bg-muted flex w-full items-center gap-3 px-4 py-2 text-left"
                  }
                >
                  <Icon size={13} className="text-muted-foreground" />
                  <span className="text-sm">{row.item.label}</span>
                  <ArrowRight size={12} className="text-muted-foreground ml-auto" />
                </button>
              );
            })}
          </div>
        ))}
      </div>
      <div className="border-border bg-muted/30 border-t px-4 py-2">
        <p className="text-muted-foreground text-[10px]">
          {flat.length} result{flat.length === 1 ? "" : "s"}
        </p>
      </div>
    </>
  );
}
