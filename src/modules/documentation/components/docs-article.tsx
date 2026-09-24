import type { ComponentType, CSSProperties } from "react";

import { findDoc } from "@/config/docs-catalog";
import { DocsArticleHeader } from "@/modules/documentation/components/docs-article-header";
import { DocsPrevNext } from "@/modules/documentation/components/docs-prev-next";
import { DocsReadingProgress } from "@/modules/documentation/components/docs-reading-progress";
import { DocsRelated } from "@/modules/documentation/components/docs-related";
import { DocsToc } from "@/modules/documentation/components/docs-toc";

const ARTICLE_ID = "doc-article-content";
const TOC_COLUMN_WIDTH = "11rem";
const TOC_GAP = "1.25rem";

export function DocsArticle({
  categorySlug,
  pageSlug,
  Content,
}: {
  categorySlug: string;
  pageSlug: string;
  Content: ComponentType;
}) {
  const doc = findDoc(categorySlug, pageSlug);
  if (!doc) {
    return null;
  }

  return (
    <>
      <DocsReadingProgress />
      <article
        className="mx-auto w-full min-w-0 max-w-6xl"
        style={
          {
            "--docs-toc-width": TOC_COLUMN_WIDTH,
            "--docs-toc-gap": TOC_GAP,
          } as CSSProperties
        }
      >
        <div className="relative">
          <div
            id={ARTICLE_ID}
            className="bg-card border-border min-w-0 overflow-hidden rounded-2xl border shadow-xs xl:me-[calc(var(--docs-toc-width)+var(--docs-toc-gap))]"
          >
            <DocsArticleHeader doc={doc} />
            <div className="docs-prose px-6 pb-10 md:px-8 md:pb-12">
              <Content />
            </div>
            <div className="px-6 pb-10 md:px-8 md:pb-12">
              <DocsRelated doc={doc} />
              <DocsPrevNext categorySlug={categorySlug} pageSlug={pageSlug} />
            </div>
          </div>
          <DocsToc containerId={ARTICLE_ID} />
        </div>
      </article>
    </>
  );
}
