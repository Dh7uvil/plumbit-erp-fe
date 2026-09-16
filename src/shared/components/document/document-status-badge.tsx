"use client";

import { StatusBadge } from "@/shared/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/components/ui/tooltip";

export type DocumentStatusVariant =
  "muted" | "warning" | "info" | "success" | "destructive" | "secondary";

export function documentStatusTone(status: string): DocumentStatusVariant {
  const tokens = status
    .toLowerCase()
    .split(/[_\s-]+/)
    .filter(Boolean);
  const has = (...keys: string[]) => keys.some((key) => tokens.includes(key));

  if (
    has(
      "active",
      "posted",
      "paid",
      "approved",
      "completed",
      "confirmed",
      "delivered",
      "received",
      "converted",
      "accepted",
    )
  ) {
    return "success";
  }
  if (has("pending", "draft", "partial", "partially", "overdue", "open")) {
    return "warning";
  }
  if (has("cancelled", "canceled", "void", "rejected", "failed", "inactive")) {
    return "destructive";
  }
  if (has("processing", "progress", "sent", "submitted")) {
    return "info";
  }
  return "muted";
}

export function documentStatusTooltip(kind: string, label: string) {
  return `${kind}: ${label}`;
}

export function DocumentStatusBadge<T extends string>({
  status,
  labels,
  variants,
  kind,
}: {
  status: T;
  labels: Record<T, string>;
  variants: Record<T, DocumentStatusVariant>;
  kind?: string;
}) {
  const label = labels[status];
  const badge = <StatusBadge variant={variants[status]}>{label}</StatusBadge>;
  if (!kind) {
    return badge;
  }
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex">{badge}</span>
      </TooltipTrigger>
      <TooltipContent>{documentStatusTooltip(kind, label)}</TooltipContent>
    </Tooltip>
  );
}
