import { AlertCircle, RefreshCw } from "lucide-react";

import { EmptyState } from "@/shared/components/feedback/empty-state";
import { Button } from "@/shared/components/ui/button";

export function DataTableEmpty({
  title = "No records found",
  message = "Try adjusting search or filters.",
}: {
  title?: string;
  message?: string;
}) {
  return <EmptyState title={title} message={message} />;
}

export function DataTableError({
  message = "An unexpected error occurred.",
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
      <div className="flex size-10 items-center justify-center rounded-full bg-red-50 dark:bg-red-950/40">
        <AlertCircle className="size-5 text-red-500" />
      </div>
      <p className="text-foreground text-sm font-medium">Something went wrong</p>
      <p className="text-muted-foreground text-xs">{message}</p>
      {onRetry ? (
        <Button type="button" variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw className="size-3.5" />
          Retry
        </Button>
      ) : null}
    </div>
  );
}
