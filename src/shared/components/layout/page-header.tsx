import type { ReactNode } from "react";

export function PageHeader({
  title,
  subtitle,
  code,
  actions,
}: {
  title: string;
  subtitle?: string;
  code?: string | null;
  actions?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <div className="flex items-center gap-3">
          <h1 className="text-foreground text-lg font-semibold tracking-tight">{title}</h1>
          {code ? (
            <span className="text-muted-foreground font-mono text-sm">{code}</span>
          ) : null}
        </div>
        {subtitle ? <p className="text-muted-foreground mt-0.5 text-sm">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  );
}
