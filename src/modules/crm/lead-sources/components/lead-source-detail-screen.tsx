"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { LeadSourceForm } from "@/modules/crm/lead-sources/components/lead-source-form";
import { leadSourcePermissions } from "@/modules/crm/lead-sources/permissions";
import { useLeadSource } from "@/modules/crm/lead-sources/queries";
import { getErrorMessage } from "@/shared/api/errors";
import { useCrudPermissions } from "@/shared/auth/use-crud-permissions";
import { DataTableError } from "@/shared/components/data-table/states";
import {
  RecordPageHeader,
  type RecordPageMode,
} from "@/shared/components/layout/record-page-header";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";

export function LeadSourceDetailScreen({
  sourceId,
  mode,
}: {
  sourceId: string;
  mode: RecordPageMode;
}) {
  const router = useRouter();
  const { canUpdate } = useCrudPermissions(leadSourcePermissions);
  const sourceQuery = useLeadSource(sourceId);
  const source = sourceQuery.data;
  const isEdit = mode === "edit";
  const viewHref = `/lead-sources/${sourceId}`;

  if (sourceQuery.isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (sourceQuery.isError || !source) {
    return (
      <div className="flex flex-col gap-3">
        <DataTableError
          message={sourceQuery.error ? getErrorMessage(sourceQuery.error) : "Lead source not found"}
          onRetry={() => sourceQuery.refetch()}
        />
        <Button type="button" variant="outline" asChild>
          <Link href="/lead-sources">Back to lead sources</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <RecordPageHeader
        title={source.name}
        listHref="/lead-sources"
        viewHref={viewHref}
        editHref={`${viewHref}/edit`}
        canUpdate={canUpdate}
        mode={mode}
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{isEdit ? "Edit lead source" : "Lead source"}</CardTitle>
        </CardHeader>
        <CardContent>
          <LeadSourceForm
            source={source}
            disabled={!isEdit}
            onSuccess={() => router.push(viewHref)}
          />
        </CardContent>
      </Card>
    </div>
  );
}
