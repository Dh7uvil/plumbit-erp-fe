"use client";

import { Badge } from "@/shared/components/ui/badge";
import { formatDate } from "@/shared/lib/format";

export function PeriodBadge({ documentDate }: { documentDate: string | null | undefined }) {
  if (!documentDate) {
    return null;
  }
  const month = Number(documentDate.slice(5, 7));
  const period = Number.isFinite(month) ? month : null;
  return (
    <Badge variant="outline" className="font-normal">
      Period {period ?? "—"} · {formatDate(documentDate)}
    </Badge>
  );
}
