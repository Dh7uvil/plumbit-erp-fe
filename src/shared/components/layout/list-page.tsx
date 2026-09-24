import type { ReactNode } from "react";

import { cn } from "@/shared/lib/cn";

export function ListPage({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-5">{children}</div>;
}

export function ListPageTable({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div data-slot="list-page-table" className={cn("flex min-h-0 flex-col", className)}>
      {children}
    </div>
  );
}

/** Toolbar, filters, and table grouped with standard list-page spacing (embedded tabs, panels). */
export function ListPageContent({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div data-slot="list-page-content" className={cn("flex flex-col gap-5", className)}>
      {children}
    </div>
  );
}
