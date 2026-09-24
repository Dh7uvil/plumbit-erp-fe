"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, BookOpen, Calendar, ChevronRight } from "lucide-react";

import type { FlatDoc } from "@/config/docs-catalog";
import { docsCategoryAccent } from "@/modules/documentation/lib/docs-theme";
import { Badge } from "@/shared/components/ui/badge";
import { getMainScrollElement } from "@/shared/lib/main-scroll";
import { cn } from "@/shared/lib/cn";

export function DocsArticleHeader({ doc }: { doc: FlatDoc }) {
  const accent = docsCategoryAccent(doc.category.slug);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [isPinned, setIsPinned] = useState(false);

  useEffect(() => {
    const main = getMainScrollElement();
    const sentinel = sentinelRef.current;
    if (!main || !sentinel) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => setIsPinned(!entry.isIntersecting),
      { root: main, threshold: 0 },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <div ref={sentinelRef} className="pointer-events-none h-px w-full shrink-0" aria-hidden="true" />
      <header
        className={cn(
          "sticky top-[var(--docs-sticky-top,5rem)] z-10 border-b transition-[padding,box-shadow,background-color,border-color] duration-200",
          isPinned
            ? "bg-card/95 border-border/80 supports-[backdrop-filter]:bg-card/85 py-3 shadow-sm backdrop-blur-md"
            : "border-transparent pb-6 pt-6 md:pb-8 md:pt-8",
        )}
      >
        <div className="px-6 md:px-8">
          {isPinned ? (
            <>
              <nav
                className="text-muted-foreground mb-1.5 flex flex-wrap items-center gap-1 text-[11px]"
                aria-label="Documentation trail"
              >
                <Link
                  href="/docs"
                  className="hover:text-primary inline-flex items-center gap-1 transition-colors"
                >
                  <BookOpen className="size-3" />
                  Docs
                </Link>
                <ChevronRight className="size-3 opacity-50" />
                <Link
                  href={`/docs/${doc.category.slug}`}
                  className="hover:text-primary transition-colors"
                >
                  {doc.category.label}
                </Link>
              </nav>
              <div className="flex min-w-0 items-center gap-2">
                <h1 className="text-foreground min-w-0 truncate text-lg font-semibold tracking-tight">
                  {doc.title}
                </h1>
                <Badge
                  variant="muted"
                  className={cn("hidden shrink-0 font-normal sm:inline-flex", accent.badge)}
                >
                  {doc.category.label}
                </Badge>
              </div>
            </>
          ) : (
            <>
              <nav
                className="text-muted-foreground mb-4 flex flex-wrap items-center gap-1 text-xs"
                aria-label="Documentation trail"
              >
                <Link
                  href="/docs"
                  className="hover:text-primary inline-flex items-center gap-1 transition-colors"
                >
                  <BookOpen className="size-3.5" />
                  Docs
                </Link>
                <ChevronRight className="size-3 opacity-50" />
                <Link
                  href={`/docs/${doc.category.slug}`}
                  className="hover:text-primary transition-colors"
                >
                  {doc.category.label}
                </Link>
                <ChevronRight className="size-3 opacity-50" />
                <span className="text-foreground font-medium">{doc.title}</span>
              </nav>
              <Link
                href="/docs"
                className="text-muted-foreground hover:text-primary mb-4 inline-flex items-center gap-1.5 text-sm transition-colors"
              >
                <ArrowLeft className="size-3.5" />
                Back to all pages
              </Link>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="muted" className={cn("font-normal", accent.badge)}>
                  {doc.category.label}
                </Badge>
                <Badge variant="muted" className="font-normal">
                  <Calendar className="me-1 inline size-3" aria-hidden="true" />
                  Reviewed {doc.lastReviewed}
                </Badge>
              </div>
              <h1 className="text-foreground mt-4 text-3xl font-semibold tracking-tight md:text-4xl">
                {doc.title}
              </h1>
              <p className="text-muted-foreground mt-3 max-w-2xl text-base leading-relaxed md:text-lg">
                {doc.description}
              </p>
            </>
          )}
        </div>
      </header>
    </>
  );
}
