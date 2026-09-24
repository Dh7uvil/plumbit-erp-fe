"use client";

import { useEffect, useState } from "react";
import { ListTree } from "lucide-react";

import { getMainScrollElement, scrollMainToHash } from "@/shared/lib/main-scroll";
import { cn } from "@/shared/lib/cn";

type TocEntry = { id: string; text: string; level: 2 | 3 };

function TocList({
  entries,
  activeId,
}: {
  entries: TocEntry[];
  activeId: string | null;
}) {
  if (entries.length === 0) {
    return null;
  }

  return (
    <ul className="border-border relative flex flex-col gap-0.5 border-s-2 ps-3">
      {entries.map((entry) => (
        <li key={entry.id}>
          <a
            href={`#${entry.id}`}
            onClick={(event) => {
              event.preventDefault();
              scrollMainToHash(`#${entry.id}`);
              window.history.replaceState(null, "", `#${entry.id}`);
            }}
            className={cn(
              "hover:text-primary block rounded-md py-1 text-[13px] leading-snug transition-colors",
              entry.level === 3 && "ps-2 text-xs",
              activeId === entry.id
                ? "text-primary -ms-[calc(0.75rem+2px)] border-primary border-s-2 ps-[calc(0.5rem+2px)] font-medium"
                : "text-muted-foreground",
            )}
          >
            {entry.text}
          </a>
        </li>
      ))}
    </ul>
  );
}

export function DocsToc({ containerId }: { containerId: string }) {
  const [entries, setEntries] = useState<TocEntry[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const container = document.getElementById(containerId);
    if (!container) {
      return;
    }
    const headings = container.querySelectorAll("h2[id], h3[id]");
    const next: TocEntry[] = [];
    headings.forEach((el) => {
      const id = el.id;
      if (!id) {
        return;
      }
      next.push({
        id,
        text: el.textContent ?? id,
        level: el.tagName === "H3" ? 3 : 2,
      });
    });
    setEntries(next);
  }, [containerId]);

  useEffect(() => {
    if (entries.length === 0) {
      return;
    }
    const scrollRoot = getMainScrollElement();
    const observer = new IntersectionObserver(
      (observed) => {
        const visible = observed
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]?.target.id) {
          setActiveId(visible[0].target.id);
        }
      },
      {
        root: scrollRoot,
        rootMargin: "-20% 0px -70% 0px",
        threshold: 0,
      },
    );
    for (const entry of entries) {
      const el = document.getElementById(entry.id);
      if (el) {
        observer.observe(el);
      }
    }
    return () => observer.disconnect();
  }, [entries]);

  const list = <TocList entries={entries} activeId={activeId} />;

  return (
    <>
      {entries.length > 0 ? (
        <div className="xl:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            className="text-muted-foreground hover:text-foreground bg-muted/40 mb-4 inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium"
          >
            <ListTree className="size-4" />
            {mobileOpen ? "Hide" : "Show"} on this page
          </button>
          {mobileOpen ? (
            <div className="bg-muted/20 border-border mb-6 rounded-xl border p-4">{list}</div>
          ) : null}
        </div>
      ) : null}
      <aside
        aria-label="On this page"
        className="pointer-events-none absolute inset-y-0 end-0 hidden w-44 xl:block"
      >
        {entries.length > 0 ? (
          <div className="pointer-events-auto sticky top-[var(--docs-sticky-top,5rem)] max-h-[calc(100vh-var(--docs-sticky-top,5rem)-1.5rem)]">
            <div className="bg-card border-border overflow-hidden rounded-xl border shadow-xs">
              <p className="text-muted-foreground border-border border-b px-4 py-2.5 text-xs font-semibold tracking-wide uppercase">
                <span className="flex items-center gap-1.5">
                  <ListTree className="size-3.5" />
                  On this page
                </span>
              </p>
              <div className="max-h-[calc(100vh-var(--docs-sticky-top,5rem)-5rem)] overflow-y-auto p-4 pt-3">
                {list}
              </div>
            </div>
          </div>
        ) : null}
      </aside>
    </>
  );
}
