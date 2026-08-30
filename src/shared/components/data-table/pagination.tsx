import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import type { PaginationMeta } from "@/shared/api/envelope";

function compactPageItems(current: number, total: number): Array<number | "ellipsis"> {
  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }

  if (current <= 4) {
    return [1, 2, 3, 4, 5, "ellipsis", total];
  }

  if (current >= total - 3) {
    return [1, "ellipsis", total - 4, total - 3, total - 2, total - 1, total];
  }

  return [1, "ellipsis", current - 1, current, current + 1, "ellipsis", total];
}

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
  const pages = compactPageItems(meta.page, totalPages);

  return (
    <div className="flex items-center justify-between gap-2 px-3 py-3">
      <p className="text-muted-foreground shrink-0 text-xs">
        {meta.total === 0 ? "No results" : `${from}–${to} of ${meta.total}`}
      </p>
      <nav className="flex min-w-0 items-center gap-1" aria-label="Pagination">
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-label="Previous"
          disabled={meta.page <= 1}
          onClick={() => onPageChange(meta.page - 1)}
        >
          <ChevronLeft className="size-3.5" />
          <span className="hidden sm:inline">Previous</span>
        </Button>
        <div className="flex items-center gap-1 overflow-x-auto">
          {pages.map((item, index) =>
            item === "ellipsis" ? (
              <span
                key={`ellipsis-${index}`}
                className="text-muted-foreground px-1 text-xs"
                aria-hidden="true"
              >
                …
              </span>
            ) : (
              <Button
                key={item}
                type="button"
                variant={item === meta.page ? "default" : "outline"}
                size="sm"
                aria-current={item === meta.page ? "page" : undefined}
                aria-label={`Page ${item}`}
                className="min-w-8 px-2"
                onClick={() => {
                  if (item !== meta.page) {
                    onPageChange(item);
                  }
                }}
              >
                {item}
              </Button>
            ),
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-label="Next"
          disabled={meta.page >= totalPages}
          onClick={() => onPageChange(meta.page + 1)}
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="size-3.5" />
        </Button>
      </nav>
    </div>
  );
}
