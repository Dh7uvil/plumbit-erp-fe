"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { BookOpen, Layers, Search, Sparkles } from "lucide-react";

import { docsCatalog, flatDocs, searchDocs } from "@/config/docs-catalog";
import { DocsPageList } from "@/modules/documentation/components/docs-page-list";
import { docsCategoryIcon } from "@/modules/documentation/components/docs-category-icon";
import { docsCategoryAccent } from "@/modules/documentation/lib/docs-theme";
import { EmptyState } from "@/shared/components/feedback/empty-state";
import { Badge } from "@/shared/components/ui/badge";
import { Input } from "@/shared/components/ui/input";
import { cn } from "@/shared/lib/cn";

const QUICK_LINKS = [
  { label: "System overview", href: "/docs/getting-started/system-overview" },
  { label: "Order to cash", href: "/docs/workflows/order-to-cash" },
  { label: "Procure to pay", href: "/docs/workflows/procure-to-pay" },
  { label: "Go-live setup", href: "/docs/workflows/go-live-setup" },
];

function DocsHero({ totalPages }: { totalPages: number }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/10 via-card to-card px-6 py-8 shadow-xs md:px-8 md:py-10">
      <div className="from-primary/5 pointer-events-none absolute -top-16 end-0 size-48 rounded-full bg-gradient-to-br to-transparent blur-2xl" />
      <div className="relative flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="max-w-xl">
          <div className="bg-primary/10 text-primary mb-4 inline-flex size-11 items-center justify-center rounded-xl">
            <BookOpen className="size-5" aria-hidden="true" />
          </div>
          <h1 className="text-foreground text-3xl font-semibold tracking-tight md:text-4xl">
            Documentation
          </h1>
          <p className="text-muted-foreground mt-2 text-base leading-relaxed">
            Plain-language guides for every part of Plumbit ERP. Each topic opens on its own page —
            browse below or use the sidebar.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="muted" className="gap-1.5 px-3 py-1.5 text-sm font-normal">
            <Layers className="size-3.5" />
            {docsCatalog.length} sections
          </Badge>
          <Badge variant="muted" className="gap-1.5 px-3 py-1.5 text-sm font-normal">
            <Sparkles className="size-3.5" />
            {totalPages} pages
          </Badge>
        </div>
      </div>
    </div>
  );
}

export function DocsPageIndex({
  className,
  showHero = false,
}: {
  className?: string;
  showHero?: boolean;
}) {
  const [query, setQuery] = useState("");
  const filteredCatalog = useMemo(() => {
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

  const totalPages = flatDocs().length;
  const visiblePages = filteredCatalog.reduce((sum, c) => sum + c.pages.length, 0);

  return (
    <div className={cn("flex flex-col gap-8", className)}>
      {showHero ? <DocsHero totalPages={totalPages} /> : null}
      <div className="relative max-w-xl">
        <Search className="text-muted-foreground pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search all pages…"
          className="bg-card h-11 rounded-xl ps-9 shadow-xs"
          aria-label="Search documentation pages"
        />
      </div>
      {!query.trim() ? (
        <div>
          <p className="text-muted-foreground mb-3 text-xs font-semibold tracking-wide uppercase">
            Popular starting points
          </p>
          <div className="flex flex-wrap gap-2">
            {QUICK_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="bg-card hover:border-primary/30 hover:text-primary border-border inline-flex items-center rounded-full border px-3.5 py-1.5 text-sm shadow-xs transition-all"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      ) : null}
      {query.trim() ? (
        <p className="text-muted-foreground text-sm">
          {visiblePages} {visiblePages === 1 ? "page" : "pages"} matching &ldquo;{query.trim()}&rdquo;
        </p>
      ) : null}
      {query.trim() && visiblePages === 0 ? (
        <EmptyState title="No pages found" message="Try different keywords or browse all sections below." />
      ) : (
        <div className="flex flex-col gap-10">
          {filteredCatalog.map((category) => {
            const Icon = docsCategoryIcon(category.slug);
            const accent = docsCategoryAccent(category.slug);
            return (
              <section key={category.slug} aria-labelledby={`docs-section-${category.slug}`}>
                <div className="mb-4 flex items-center gap-3">
                  <span
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-xl",
                      accent.icon,
                    )}
                  >
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2
                      id={`docs-section-${category.slug}`}
                      className="text-foreground text-base font-semibold tracking-tight"
                    >
                      {category.label}
                    </h2>
                    <p className="text-muted-foreground text-xs">{category.description}</p>
                  </div>
                  <Badge variant="muted" className="shrink-0 tabular-nums">
                    {category.pages.length}
                  </Badge>
                </div>
                <DocsPageList category={category} pages={category.pages} />
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function DocsHomeScreen() {
  return (
    <section className="mx-auto w-full max-w-6xl">
      <DocsPageIndex showHero />
    </section>
  );
}
