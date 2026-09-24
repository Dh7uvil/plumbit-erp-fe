import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { docsCatalog, findDocCategory } from "@/config/docs-catalog";
import { DocsPageList } from "@/modules/documentation/components/docs-page-list";
import { DocsCategoryIcon } from "@/modules/documentation/components/docs-category-icon";
import { docsCategoryAccent } from "@/modules/documentation/lib/docs-theme";
import { cn } from "@/shared/lib/cn";

export function generateStaticParams() {
  return docsCatalog.map((category) => ({ category: category.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category: categorySlug } = await params;
  const category = findDocCategory(categorySlug);
  if (!category) {
    return { title: "Documentation" };
  }
  return { title: `${category.label} — Documentation` };
}

export default async function DocsCategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category: categorySlug } = await params;
  const category = findDocCategory(categorySlug);
  if (!category) {
    notFound();
  }

  const accent = docsCategoryAccent(category.slug);
  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <Link
        href="/docs"
        className="text-muted-foreground hover:text-primary inline-flex items-center gap-1.5 text-sm transition-colors"
      >
        <ArrowLeft className="size-3.5" />
        All pages
      </Link>
      <header className="flex items-start gap-4">
        <span className={cn("flex size-12 shrink-0 items-center justify-center rounded-2xl", accent.icon)}>
          <DocsCategoryIcon slug={category.slug} className="size-5" />
        </span>
        <div>
          <h1 className="text-foreground text-2xl font-semibold tracking-tight md:text-3xl">
            {category.label}
          </h1>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed md:text-base">
            {category.description}
          </p>
          <p className="text-muted-foreground mt-2 text-xs tabular-nums">
            {category.pages.length} dedicated pages
          </p>
        </div>
      </header>
      <DocsPageList category={category} pages={category.pages} />
    </section>
  );
}
