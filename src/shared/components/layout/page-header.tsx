import type { ReactNode } from "react";

import { cn } from "@/shared/lib/cn";

export function PageHeader({
  title,
  subtitle,
  code,
  badges,
  actions,
}: {
  title: string;
  subtitle?: string;
  code?: string | null;
  badges?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-foreground text-lg font-semibold tracking-tight">{title}</h1>
          {code ? <span className="text-muted-foreground font-mono text-sm">{code}</span> : null}
          {badges ? <div className="flex flex-wrap items-center gap-2">{badges}</div> : null}
        </div>
        {subtitle ? <p className="text-muted-foreground mt-0.5 text-sm">{subtitle}</p> : null}
      </div>
      {actions ? (
        <div className={cn("flex shrink-0 flex-wrap items-center gap-2")}>{actions}</div>
      ) : null}
    </div>
  );
}
