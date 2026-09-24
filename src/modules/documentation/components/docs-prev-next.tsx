import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { prevNext, type FlatDoc } from "@/config/docs-catalog";
import { cn } from "@/shared/lib/cn";

export function DocsPrevNext({
  categorySlug,
  pageSlug,
}: {
  categorySlug: string;
  pageSlug: string;
}) {
  const { prev, next } = prevNext(categorySlug, pageSlug);
  if (!prev && !next) {
    return null;
  }
  return (
    <nav
      className="border-border mt-10 grid gap-3 border-t pt-8 sm:grid-cols-2"
      aria-label="Previous and next pages"
    >
      {prev ? <NavLink doc={prev} direction="prev" /> : <span className="hidden sm:block" />}
      {next ? <NavLink doc={next} direction="next" /> : <span className="hidden sm:block" />}
    </nav>
  );
}

function NavLink({ doc, direction }: { doc: FlatDoc; direction: "prev" | "next" }) {
  const isNext = direction === "next";
  const Icon = isNext ? ArrowRight : ArrowLeft;

  return (
    <Link
      href={doc.path}
      className={cn(
        "group bg-muted/30 hover:border-primary/25 hover:bg-muted/50 flex flex-col gap-2 rounded-xl border p-4 transition-all hover:shadow-sm",
        isNext && "sm:items-end sm:text-end",
      )}
    >
      <span
        className={cn(
          "text-muted-foreground flex items-center gap-1.5 text-[11px] font-semibold tracking-wide uppercase",
          isNext && "sm:flex-row-reverse",
        )}
      >
        <span className="bg-background group-hover:bg-primary/10 group-hover:text-primary flex size-6 items-center justify-center rounded-full border transition-colors">
          <Icon className="size-3.5" />
        </span>
        {isNext ? "Next page" : "Previous page"}
      </span>
      <span className="text-foreground text-sm font-semibold">{doc.title}</span>
      <span className="text-muted-foreground text-xs">{doc.category.label}</span>
    </Link>
  );
}
