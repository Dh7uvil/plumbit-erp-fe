"use client";

import type { ReactNode } from "react";

import {
  DOCUMENT_VIEW_TABLE_VISIBLE_ROWS,
  documentViewTableContainerClassName,
  documentViewTableInnerClassName,
} from "@/shared/components/document/document-view-table";

export function DocumentViewTableContainer({
  viewMode,
  rowCount,
  className,
  children,
}: {
  viewMode: boolean;
  rowCount: number;
  className?: string;
  children: ReactNode;
}) {
  const scrollable = viewMode && rowCount > DOCUMENT_VIEW_TABLE_VISIBLE_ROWS;

  if (!viewMode) {
    return (
      <div className={documentViewTableContainerClassName(viewMode, rowCount, className)}>
        {children}
      </div>
    );
  }

  return (
    <div
      data-document-view-table={scrollable ? "" : undefined}
      className={documentViewTableContainerClassName(viewMode, rowCount, className)}
    >
      <div className={documentViewTableInnerClassName(viewMode)}>{children}</div>
    </div>
  );
}
