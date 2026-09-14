import type { ReactNode } from "react";

import { cn } from "@/shared/lib/cn";

export function DataTableToolbar({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("flex flex-wrap items-end gap-2", className)}>{children}</div>;
}
