"use client";

import Link from "next/link";
import { ChevronRight, FileText } from "lucide-react";

import type { DocCategory, DocPage } from "@/config/docs-catalog";
import { docsCategoryAccent } from "@/modules/documentation/lib/docs-theme";
import { cn } from "@/shared/lib/cn";

export function DocsPageListItem({
  category,
  page,
  compact = false,
}: {
  category: DocCategory;
  page: DocPage;
  compact?: boolean;
}) {
  const accent = docsCategoryAccent(category.slug);

  return (
    <li>
      <Link
        href={`/docs/${category.slug}/${page.slug}`}
        className={cn(
          "group hover:bg-muted/50 flex items-start gap-3 border-s-2 border-transparent px-4 transition-all hover:border-s-primary/40",
          compact ? "py-2.5" : "py-3.5",
        )}
      >
        <span
          className={cn(
            "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors",
            accent.icon,
            "group-hover:scale-105",
          )}
        >
          <FileText className="size-4" aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="text-foreground group-hover:text-primary block text-sm font-medium transition-colors">
            {page.title}
          </span>
          {!compact ? (
            <span className="text-muted-foreground mt-1 block text-xs leading-relaxed">
              {page.description}
            </span>
          ) : null}
        </span>
        <ChevronRight className="text-muted-foreground mt-1 size-4 shrink-0 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
      </Link>
    </li>
  );
}

export function DocsPageList({
  category,
  pages,
  compact = false,
}: {
  category: DocCategory;
  pages: DocPage[];
  compact?: boolean;
}) {
  return (
    <ul className="bg-card border-border divide-border overflow-hidden rounded-xl border shadow-xs divide-y">
      {pages.map((page) => (
        <DocsPageListItem key={page.slug} category={category} page={page} compact={compact} />
      ))}
    </ul>
  );
}
