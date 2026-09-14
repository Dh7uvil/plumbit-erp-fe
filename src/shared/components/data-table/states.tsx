import { Inbox, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { EmptyState } from "@/shared/components/feedback/empty-state";
import { ErrorState } from "@/shared/components/feedback/error-state";

export function DataTableEmpty({
  title = "No records found",
  message = "Try adjusting search or filters.",
  icon = Inbox,
  action,
}: {
  title?: string;
  message?: string;
  icon?: LucideIcon;
  action?: ReactNode;
}) {
  return <EmptyState title={title} message={message} icon={icon} action={action} />;
}

export function DataTableError({
  message = "An unexpected error occurred.",
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return <ErrorState message={message} onRetry={onRetry} />;
}
