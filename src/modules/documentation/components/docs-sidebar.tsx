"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Home, Search } from "lucide-react";

import { docsCatalog, searchDocs, type DocCategory } from "@/config/docs-catalog";
import { docsCategoryIcon } from "@/modules/documentation/components/docs-category-icon";
import { docsCategoryAccent } from "@/modules/documentation/lib/docs-theme";
import { Input } from "@/shared/components/ui/input";
import { cn } from "@/shared/lib/cn";

export function DocsSidebar({ className }: { className?: string }) {
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const [openCategories, setOpenCategories] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    const activeSlugs = docsCatalog
      .filter((category) =>
        category.pages.some((page) => pathname === `/docs/${category.slug}/${page.slug}`),
      )
      .map((category) => category.slug);
    if (activeSlugs.length === 0) {
      return;
    }
    setOpenCategories((current) => new Set([...current, ...activeSlugs]));
  }, [pathname]);

  const filtered = useMemo(() => {
    const needle = query.trim();
    if (!needle) {
      return docsCatalog;
    }
    const hits = new Set(searchDocs(needle, 100).map((d) => `${d.category.slug}/${d.slug}`));
    return docsCatalog
      .map((category) => ({
        ...category,
        pages: category.pages.filter((p) => hits.has(`${category.slug}/${p.slug}`)),
      }))
      .filter((c) => c.pages.length > 0);
  }, [query]);

  function toggleCategory(slug: string) {
    setOpenCategories((current) => {
      const next = new Set(current);
      if (next.has(slug)) {
        next.delete(slug);
      } else {
        next.add(slug);
      }
      return next;
    });
  }

  return (
    <nav className={cn("flex flex-col gap-3", className)} aria-label="Documentation pages">
      <Link
        href="/docs"
        className={cn(
          "flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium transition-all",
          pathname === "/docs"
            ? "bg-primary/10 text-primary shadow-xs"
            : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
        )}
      >
        <Home className="size-4 shrink-0" aria-hidden="true" />
        All pages
      </Link>
      <div className="relative">
        <Search className="text-muted-foreground pointer-events-none absolute start-2.5 top-1/2 size-3.5 -translate-y-1/2" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter pages…"
          className="h-9 rounded-lg ps-8 text-sm"
          aria-label="Filter documentation pages"
        />
      </div>
      <div className="flex flex-col gap-0.5 pb-2">
        {filtered.map((category) => (
          <DocsSidebarCategory
            key={category.slug}
            category={category}
            pathname={pathname}
            open={query.trim() ? true : openCategories.has(category.slug)}
            onToggle={() => toggleCategory(category.slug)}
          />
        ))}
      </div>
    </nav>
  );
}

function DocsSidebarCategory({
  category,
  pathname,
  open,
  onToggle,
}: {
  category: DocCategory;
  pathname: string;
  open: boolean;
  onToggle: () => void;
}) {
  const accent = docsCategoryAccent(category.slug);
  const CategoryIcon = docsCategoryIcon(category.slug);
  const activeInCategory = category.pages.some(
    (p) => pathname === `/docs/${category.slug}/${p.slug}`,
  );

  return (
    <div className="flex flex-col">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className={cn(
          "hover:bg-muted/60 flex w-full items-center gap-1.5 rounded-lg px-2 py-2 text-start transition-colors",
          activeInCategory && "bg-muted/40",
        )}
      >
        {open ? (
          <ChevronDown className="text-muted-foreground size-3.5 shrink-0" aria-hidden="true" />
        ) : (
          <ChevronRight className="text-muted-foreground size-3.5 shrink-0" aria-hidden="true" />
        )}
        <span className={cn("flex size-5 shrink-0 items-center justify-center rounded", accent.icon)}>
          <CategoryIcon className="size-3" aria-hidden="true" />
        </span>
        <span
          className={cn(
            "min-w-0 flex-1 truncate text-xs font-semibold tracking-wide uppercase",
            activeInCategory ? "text-primary" : "text-muted-foreground",
          )}
        >
          {category.label}
        </span>
        <span className="text-muted-foreground text-[10px] tabular-nums">{category.pages.length}</span>
      </button>
      {open ? (
        <ul className="mt-0.5 mb-1 flex flex-col gap-0.5 border-s ps-2 ms-3">
          {category.pages.map((page) => {
            const href = `/docs/${category.slug}/${page.slug}`;
            const active = pathname === href;
            return (
              <li key={page.slug}>
                <Link
                  href={href}
                  className={cn(
                    "block rounded-md px-2 py-1.5 text-[13px] leading-snug transition-all",
                    active
                      ? "bg-primary/10 text-primary border-primary border-s-2 font-medium shadow-xs"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground border-s-2 border-transparent",
                  )}
                >
                  {page.title}
                </Link>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
