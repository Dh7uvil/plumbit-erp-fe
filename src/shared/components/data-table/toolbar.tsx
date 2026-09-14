import type { ReactNode } from "react";

import { Label } from "@/shared/components/ui/label";
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

export function ToolbarControl({
  label,
  htmlFor,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1", className)}>
      <Label htmlFor={htmlFor} className="text-muted-foreground text-xs font-medium">
        {label}
      </Label>
      {children}
    </div>
  );
}

export function toolbarFilterButtonClass(active = false) {
  return cn(
    "border-info/60 bg-info/20 text-info hover:bg-info/30 hover:text-info dark:bg-info/15 dark:hover:bg-info/25",
    active && "border-info bg-info/30 dark:bg-info/25",
  );
}

export function toolbarSortButtonClass(active = false) {
  return cn(
    "border-primary/55 bg-primary/15 text-primary hover:bg-primary/25 hover:text-primary dark:bg-primary/20 dark:hover:bg-primary/30",
    active && "border-primary bg-primary/25 dark:bg-primary/30",
  );
}
