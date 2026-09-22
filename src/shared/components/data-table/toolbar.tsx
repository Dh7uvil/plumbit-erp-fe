import type { ReactNode } from "react";

import { Label } from "@/shared/components/ui/label";
import { cn } from "@/shared/lib/cn";

export const toolbarLabelClass = "text-muted-foreground text-sm font-normal";

export function DataTableToolbar({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("flex w-full flex-wrap items-end gap-2", className)}>{children}</div>;
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
      <Label htmlFor={htmlFor} className={toolbarLabelClass}>
        {label}
      </Label>
      {children}
    </div>
  );
}

export function toolbarFilterButtonClass(active = false) {
  return cn(
    "border-transparent bg-info text-white hover:bg-info/90 hover:text-white",
    active && "shadow-sm",
  );
}

export function toolbarSortButtonClass(active = false) {
  return cn(
    "border-transparent bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground",
    active && "shadow-sm",
  );
}
