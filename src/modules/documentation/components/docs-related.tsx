import Link from "next/link";
import { ArrowUpRight, BookOpen } from "lucide-react";

import { findDoc, type FlatDoc } from "@/config/docs-catalog";
import { AppLink } from "@/modules/documentation/components/mdx/app-link";
import { docsCategoryAccent } from "@/modules/documentation/lib/docs-theme";
import { cn } from "@/shared/lib/cn";

export function DocsRelated({ doc }: { doc: FlatDoc }) {
  const related = (doc.related ?? [])
    .map((ref) => {
      const [cat, slug] = ref.split("/");
      return findDoc(cat, slug);
    })
    .filter((d): d is FlatDoc => Boolean(d));

  if (related.length === 0 && !(doc.appHrefs && doc.appHrefs.length > 0)) {
    return null;
  }

  return (
    <div className="not-prose border-border mt-10 border-t pt-8">
      <div className="mb-4 flex items-center gap-2">
        <BookOpen className="text-primary size-4" aria-hidden="true" />
        <h2 className="text-foreground text-sm font-semibold">Related documentation</h2>
      </div>
      {related.length > 0 ? (
        <ul className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {related.map((r) => {
            const accent = docsCategoryAccent(r.category.slug);
            return (
              <li key={r.path}>
                <Link
                  href={r.path}
                  className="group hover:border-primary/25 bg-muted/20 flex h-full flex-col gap-1 rounded-xl border p-3 transition-all hover:shadow-xs"
                >
                  <span className={cn("w-fit rounded px-1.5 py-0.5 text-[10px] font-medium", accent.badge)}>
                    {r.category.label}
                  </span>
                  <span className="text-foreground group-hover:text-primary text-sm font-medium transition-colors">
                    {r.title}
                  </span>
                  <span className="text-muted-foreground line-clamp-2 text-xs leading-relaxed">
                    {r.description}
                  </span>
                  <ArrowUpRight className="text-muted-foreground ms-auto size-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
                </Link>
              </li>
            );
          })}
        </ul>
      ) : null}
      {doc.appHrefs && doc.appHrefs.length > 0 ? (
        <div>
          <p className="text-muted-foreground mb-2 text-xs font-medium uppercase">Open in the app</p>
          <div className="flex flex-wrap gap-2">
            {doc.appHrefs.map((href) => (
              <AppLink key={href} href={href}>
                Open {href.replace(/^\//, "").replace(/-/g, " ")}
              </AppLink>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
