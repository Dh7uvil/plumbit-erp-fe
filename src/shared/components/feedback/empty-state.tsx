import { Layers, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function EmptyState({
  title,
  message,
  icon: Icon = Layers,
  action,
}: {
  title?: string;
  message?: string;
  icon?: LucideIcon;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-4 py-12 text-center">
      <div className="bg-muted flex size-10 items-center justify-center rounded-full">
        <Icon className="text-muted-foreground size-[18px]" />
      </div>
      {title ? <p className="text-foreground text-sm font-medium">{title}</p> : null}
      {message ? <p className="text-muted-foreground max-w-xs text-xs">{message}</p> : null}
      {action}
    </div>
  );
}
