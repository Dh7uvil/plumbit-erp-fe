import type { ReactNode } from "react";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/components/ui/tooltip";
import { cn } from "@/shared/lib/cn";

function headerCodeTooltip(codeLabel?: string, codeTooltip?: string): string {
  if (codeTooltip) {
    return codeTooltip;
  }
  if (codeLabel) {
    return `${codeLabel} ID`;
  }
  return "ID";
}

function PageHeaderCode({
  code,
  codeLabel,
  codeTooltip,
}: {
  code: string;
  codeLabel?: string;
  codeTooltip?: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="text-muted-foreground cursor-default font-mono text-sm underline decoration-dotted underline-offset-4">
          {code}
        </span>
      </TooltipTrigger>
      <TooltipContent>{headerCodeTooltip(codeLabel, codeTooltip)}</TooltipContent>
    </Tooltip>
  );
}

export function PageHeader({
  title,
  subtitle,
  code,
  codeLabel,
  codeTooltip,
  badges,
  actions,
}: {
  title: string;
  subtitle?: string;
  code?: string | null;
  codeLabel?: string;
  codeTooltip?: string;
  badges?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-foreground text-lg font-semibold tracking-tight">{title}</h1>
          {code && code !== title ? (
            <PageHeaderCode code={code} codeLabel={codeLabel} codeTooltip={codeTooltip} />
          ) : null}
          {badges ? <div className="flex flex-wrap items-center gap-2">{badges}</div> : null}
        </div>
        {subtitle ? <p className="text-muted-foreground mt-0.5 text-sm">{subtitle}</p> : null}
      </div>
      {actions ? (
        <div data-page-actions className={cn("flex shrink-0 flex-wrap items-center gap-2")}>
          {actions}
        </div>
      ) : null}
    </div>
  );
}
