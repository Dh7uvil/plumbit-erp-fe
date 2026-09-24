"use client";

import Link from "next/link";
import { ArrowLeft, BookOpen, Calendar, ChevronRight } from "lucide-react";

import type { FlatDoc } from "@/config/docs-catalog";
import { docsCategoryAccent } from "@/modules/documentation/lib/docs-theme";
import { Badge } from "@/shared/components/ui/badge";
import { cn } from "@/shared/lib/cn";

export function DocsArticleHeader({ doc }: { doc: FlatDoc }) {
  const accent = docsCategoryAccent(doc.category.slug);

  return (
    <header className="mb-8">
      <nav
        className="text-muted-foreground mb-4 flex flex-wrap items-center gap-1 text-xs"
        aria-label="Documentation trail"
      >
        <Link href="/docs" className="hover:text-primary inline-flex items-center gap-1 transition-colors">
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
      <div className="from-border via-border/60 mt-8 h-px w-full bg-gradient-to-r to-transparent" />
    </header>
  );
}
