import { Badge } from "@/shared/components/ui/badge";
import { cn } from "@/shared/lib/cn";

export function StatusFlow({ statuses }: { statuses: string[] }) {
  return (
    <div className="not-prose my-4 flex flex-wrap items-center gap-2">
      {statuses.map((status, index) => (
        <span key={status} className="flex items-center gap-2">
          <Badge variant="muted" className="font-mono text-xs uppercase">
            {status.replace(/_/g, " ")}
          </Badge>
          {index < statuses.length - 1 ? (
            <span className={cn("text-muted-foreground text-xs")} aria-hidden="true">
              →
            </span>
          ) : null}
        </span>
      ))}
    </div>
  );
}

export function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="bg-muted text-muted-foreground border-border rounded border px-1.5 py-0.5 font-mono text-[11px]">
      {children}
    </kbd>
  );
}
