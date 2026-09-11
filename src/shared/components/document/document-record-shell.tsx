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
import { Skeleton } from "@/shared/components/ui/skeleton";

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
  activity,
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
  activity?: ReactNode;
}) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
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

  return (
    <div className="flex flex-col gap-5">
      <RecordPageHeader
        title={title}
        subtitle={subtitle}
        badges={badges}
        listHref={listHref}
        viewHref={viewHref}
        editHref={editHref}
        canUpdate={canUpdate}
        mode={mode}
        extraActions={mode === "view" ? workflow : null}
      />
      {banner}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{formTitle}</CardTitle>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
      {panels}
      {attachments}
      {activity}
    </div>
  );
}
