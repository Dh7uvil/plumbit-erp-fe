import Link from "next/link";

import { findDoc } from "@/config/docs-catalog";

export function DocLink({ href, children }: { href: string; children: React.ReactNode }) {
  const normalized = href.replace(/^\/docs\//, "");
  const [categorySlug, pageSlug] = normalized.split("/");
  const doc = findDoc(categorySlug, pageSlug);
  const path = doc ? doc.path : `/docs/${normalized}`;

  return (
    <Link href={path} className="text-primary font-medium underline-offset-4 hover:underline">
      {children}
    </Link>
  );
}
