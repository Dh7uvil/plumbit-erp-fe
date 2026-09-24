import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { docsCatalog, findDoc } from "@/config/docs-catalog";
import { loadDocComponent } from "@/content/docs-loaders";
import { DocsArticle } from "@/modules/documentation/components/docs-article";

export function generateStaticParams() {
  return docsCatalog.flatMap((category) =>
    category.pages.map((page) => ({
      category: category.slug,
      slug: page.slug,
    })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string; slug: string }>;
}): Promise<Metadata> {
  const { category, slug } = await params;
  const doc = findDoc(category, slug);
  if (!doc) {
    return { title: "Documentation" };
  }
  return { title: `${doc.title} — Documentation` };
}

export default async function DocsArticlePage({
  params,
}: {
  params: Promise<{ category: string; slug: string }>;
}) {
  const { category, slug } = await params;
  const doc = findDoc(category, slug);
  if (!doc) {
    notFound();
  }

  const loader = loadDocComponent(`${category}/${slug}`);
  if (!loader) {
    notFound();
  }

  const { default: Content } = await loader();

  return <DocsArticle categorySlug={category} pageSlug={slug} Content={Content} />;
}
