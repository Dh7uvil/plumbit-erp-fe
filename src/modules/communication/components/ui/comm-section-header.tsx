"use client";

import type { ReactNode } from "react";

import { cn } from "@/shared/lib/cn";

export function CommSectionHeader({
  title,
  action,
  className,
}: {
  title: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center justify-between px-3 pt-3", className)}>
      <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
        {title}
      </p>
      {action}
    </div>
  );
}
