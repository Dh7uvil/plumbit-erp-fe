import { cn } from "@/shared/lib/cn";

export const DOCUMENT_VIEW_TABLE_VISIBLE_ROWS = 10;

export function documentViewTableContainerClassName(
  viewMode: boolean,
  rowCount: number,
  className?: string,
): string {
  if (!viewMode) {
    return cn("document-view-table-outer document-view-table-outer--edit", className);
  }

  const scrollable = rowCount > DOCUMENT_VIEW_TABLE_VISIBLE_ROWS;

  return cn(
    "document-view-table-outer document-view-table-outer--view",
    scrollable ? "document-view-table-outer--view-fixed" : "document-view-table-outer--view-max",
    className,
  );
}

export function documentViewTableInnerClassName(viewMode: boolean): string {
  return viewMode ? "document-view-table-inner-x" : "";
}
