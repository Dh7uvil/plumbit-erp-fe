import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import type { PaginationMeta } from "@/shared/api/envelope";

export function DataTablePagination({
  meta,
  onPageChange,
}: {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
}) {
  const totalPages = Math.max(meta.total_pages, 1);
  const from = meta.total === 0 ? 0 : (meta.page - 1) * meta.page_size + 1;
  const to = Math.min(meta.page * meta.page_size, meta.total);

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-3">
      <p className="text-muted-foreground text-xs">
        {meta.total === 0 ? "No results" : `${from}–${to} of ${meta.total}`}
      </p>
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={meta.page <= 1}
          onClick={() => onPageChange(meta.page - 1)}
        >
          <ChevronLeft className="size-3.5" />
          Previous
        </Button>
        <span className="text-muted-foreground min-w-16 px-2 text-center text-xs">
          {meta.page} / {totalPages}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={meta.page >= totalPages}
          onClick={() => onPageChange(meta.page + 1)}
        >
          Next
          <ChevronRight className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}
