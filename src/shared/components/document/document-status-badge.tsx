import { Badge } from "@/shared/components/ui/badge";

export type DocumentStatusVariant =
  "muted" | "warning" | "info" | "success" | "destructive" | "secondary";

export function DocumentStatusBadge<T extends string>({
  status,
  labels,
  variants,
}: {
  status: T;
  labels: Record<T, string>;
  variants: Record<T, DocumentStatusVariant>;
}) {
  return <Badge variant={variants[status]}>{labels[status]}</Badge>;
}
