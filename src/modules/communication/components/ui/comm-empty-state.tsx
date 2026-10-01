"use client";

import { MessageSquare, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { EmptyState } from "@/shared/components/feedback/empty-state";

export function CommEmptyState({
  title = "Nothing here yet",
  message,
  icon = MessageSquare,
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
    <EmptyState
      title={title}
      message={message}
      icon={icon}
      action={action}
      className={className}
    />
  );
}
