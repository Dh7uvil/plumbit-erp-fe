"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { findActiveNav } from "@/config/navigation";
import { buildBreadcrumbs } from "@/shared/components/layout/breadcrumb";
import { useBreadcrumbRecordLabel } from "@/shared/components/layout/breadcrumb-record";
import { useIsClient } from "@/shared/hooks/use-is-client";

export function AppBreadcrumb() {
  const pathname = usePathname();
  const isClient = useIsClient();
  const recordLabel = useBreadcrumbRecordLabel();
  const active = findActiveNav(pathname);
  const crumbs = buildBreadcrumbs({
    pathname,
    active,
    recordLabel: isClient ? recordLabel : null,
  });

  return (
    <nav
      className="hidden min-w-0 items-center gap-1.5 text-xs sm:flex"
      aria-label="Breadcrumb"
      suppressHydrationWarning
    >
      <ol className="flex min-w-0 items-center gap-1.5" suppressHydrationWarning>
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;
          return (
            <li key={`${crumb.label}-${index}`} className="flex min-w-0 items-center gap-1.5">
              {index > 0 ? (
                <ChevronRight size={11} className="text-muted-foreground/40 shrink-0" />
              ) : null}
              {crumb.href && !isLast ? (
                <Link
                  href={crumb.href}
                  className="text-muted-foreground/70 hover:text-foreground truncate transition-colors"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span
                  className={
                    isLast
                      ? "text-foreground truncate font-medium"
                      : "text-muted-foreground/60 truncate"
                  }
                  aria-current={isLast ? "page" : undefined}
                >
                  {crumb.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
