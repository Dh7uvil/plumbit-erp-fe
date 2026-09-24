import { Badge } from "@/shared/components/ui/badge";
import { cn } from "@/shared/lib/cn";

export type LifecycleTransition = {
  from: string;
  action: string;
  to: string;
  optional?: boolean;
};

export function LifecycleDiagram({
  mainPath,
  branches,
  compact,
}: {
  /** Ordered statuses on the primary happy path */
  mainPath: string[];
  /** Side transitions (reject, cancel, reopen, etc.) */
  branches?: LifecycleTransition[];
  /** Simple DRAFT → POSTED / CANCELLED layout */
  compact?: boolean;
}) {
  if (compact && mainPath.length <= 3) {
    return (
      <div className="not-prose my-4 flex flex-wrap items-center gap-2">
        {mainPath.map((status, index) => (
          <span key={status} className="flex items-center gap-2">
            <StatusBadge status={status} />
            {index < mainPath.length - 1 ? (
              <span className="text-muted-foreground text-xs" aria-hidden="true">
                →
              </span>
            ) : null}
          </span>
        ))}
        {branches?.map((branch) => (
          <span
            key={`${branch.from}-${branch.action}-${branch.to}`}
            className="text-muted-foreground border-border ms-2 border-s ps-3 text-xs"
          >
            <span className="font-mono">{branch.action}</span>: {formatStatus(branch.from)} →{" "}
            {formatStatus(branch.to)}
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className="not-prose my-4 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {mainPath.map((status, index) => (
          <span key={`${status}-${index}`} className="flex items-center gap-2">
            <StatusBadge status={status} />
            {index < mainPath.length - 1 ? (
              <span className="text-muted-foreground text-xs" aria-hidden="true">
                →
              </span>
            ) : null}
          </span>
        ))}
      </div>
      {branches?.length ? (
        <ul className="border-border text-muted-foreground space-y-1 border-s-2 ps-4 text-xs">
          {branches.map((branch) => (
            <li
              key={`${branch.from}-${branch.action}-${branch.to}`}
              className={cn(branch.optional && "opacity-80")}
            >
              <span className="text-foreground font-medium">{formatStatus(branch.from)}</span>
              {" — "}
              <span className="font-mono">{branch.action}</span>
              {" → "}
              <span className="text-foreground font-medium">{formatStatus(branch.to)}</span>
              {branch.optional ? (
                <span className="text-muted-foreground ms-1">(optional)</span>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function StatusBadge({ status, optional }: { status: string; optional?: boolean }) {
  return (
    <Badge
      variant="muted"
      className={cn("font-mono text-xs uppercase", optional && "border-dashed opacity-75")}
    >
      {formatStatus(status)}
    </Badge>
  );
}

function formatStatus(status: string): string {
  return status.replace(/_/g, " ");
}
