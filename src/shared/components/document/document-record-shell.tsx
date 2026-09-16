"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { getErrorMessage } from "@/shared/api/errors";
import { DataTableError } from "@/shared/components/data-table/states";
import {
  RecordPageHeader,
  type RecordPageMode,
} from "@/shared/components/layout/record-page-header";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { PageLoadingState } from "@/shared/components/feedback/loading-state";
import { HistoryHeaderButton } from "@/shared/components/document/history-header-button";
import { historyHrefFromViewHref } from "@/shared/lib/history";

export function DocumentRecordShell({
  isLoading,
  isError,
  error,
  notFoundMessage,
  onRetry,
  backHref,
  backLabel,
  title,
  subtitle,
  code,
  listHref,
  viewHref,
  editHref,
  canUpdate,
  mode,
  badges,
  workflow,
  banner,
  formTitle,
  children,
  panels,
  attachments,
  printHref,
  historyHref,
}: {
  isLoading: boolean;
  isError: boolean;
  error?: unknown;
  notFoundMessage: string;
  onRetry: () => void;
  backHref: string;
  backLabel: string;
  title: string;
  subtitle?: string;
  code?: string | null;
  listHref: string;
  viewHref: string;
  editHref?: string;
  canUpdate: boolean;
  mode: RecordPageMode;
  badges?: ReactNode;
  workflow?: ReactNode;
  banner?: ReactNode;
  formTitle: string;
  children: ReactNode;
  panels?: ReactNode;
  attachments?: ReactNode;
  printHref?: string;
  historyHref?: string;
}) {
  if (isLoading) {
    return <PageLoadingState />;
  }

  if (isError) {
    return (
      <div className="flex flex-col gap-3">
        <DataTableError
          message={error ? getErrorMessage(error) : notFoundMessage}
          onRetry={onRetry}
        />
        <Button type="button" variant="outline" asChild>
          <Link href={backHref}>{backLabel}</Link>
        </Button>
      </div>
    );
  }

  const resolvedHistoryHref = historyHref ?? historyHrefFromViewHref(viewHref, code);

  return (
    <div className="flex flex-col gap-5">
      <RecordPageHeader
        title={title}
        subtitle={subtitle}
        code={code}
        badges={badges}
        listHref={listHref}
        viewHref={viewHref}
        editHref={editHref}
        canUpdate={canUpdate}
        mode={mode}
        extraActions={
          mode === "view" ? (
            <div className="flex max-w-full flex-wrap items-center justify-end gap-2">
              {printHref ? (
                <Button type="button" size="sm" variant="outline" asChild>
                  <Link href={printHref}>Print</Link>
                </Button>
              ) : null}
              {workflow}
            </div>
          ) : null
        }
      />
      {banner}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle className="text-base">{formTitle}</CardTitle>
          {mode === "view" && resolvedHistoryHref ? (
            <HistoryHeaderButton href={resolvedHistoryHref} />
          ) : null}
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
      {panels}
      {attachments}
    </div>
  );
}
