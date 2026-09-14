import { Inbox, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/shared/lib/cn";

export function EmptyState({
  title,
  message,
  icon: Icon = Inbox,
  action,
  className,
}: {
  title?: string;
  message?: string;
  icon?: LucideIcon;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 px-4 py-12 text-center",
        className,
      )}
    >
      <div className="bg-muted text-muted-foreground flex size-11 items-center justify-center rounded-full">
        <Icon className="size-5" aria-hidden="true" />
      </div>
      {title ? <p className="text-foreground text-sm font-medium">{title}</p> : null}
      {message ? <p className="text-muted-foreground max-w-sm text-sm">{message}</p> : null}
      {action}
    </div>
  );
}
