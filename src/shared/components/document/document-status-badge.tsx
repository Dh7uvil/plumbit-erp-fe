import { StatusBadge } from "@/shared/components/ui/badge";

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

export function DocumentStatusBadge<T extends string>({
  status,
  labels,
  variants,
}: {
  status: T;
  labels: Record<T, string>;
  variants: Record<T, DocumentStatusVariant>;
}) {
  return <StatusBadge variant={variants[status]}>{labels[status]}</StatusBadge>;
}
