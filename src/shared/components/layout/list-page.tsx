import type { ReactNode } from "react";

import { cn } from "@/shared/lib/cn";

export function ListPage({ children }: { children: ReactNode }) {
  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col gap-5 overflow-hidden",
        "[&>:not([data-slot=list-page-table])]:shrink-0",
        "[&>[data-slot=list-page-table]]:min-h-0 [&>[data-slot=list-page-table]]:flex-1 [&>[data-slot=list-page-table]]:overflow-hidden",
        "[&>[data-slot=list-page-table]_[data-slot=card]]:overflow-hidden",
        "[&>[data-slot=list-page-table]_[data-slot=table-container]]:min-h-0 [&>[data-slot=list-page-table]_[data-slot=table-container]]:flex-1",
      )}
    >
      {children}
    </div>
  );
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
