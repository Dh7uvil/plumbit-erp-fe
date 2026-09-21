"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { LostReasonForm } from "@/modules/crm/lost-reasons/components/lost-reason-form";
import { lostReasonPermissions } from "@/modules/crm/lost-reasons/permissions";
import { useLostReason } from "@/modules/crm/lost-reasons/queries";
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

export function LostReasonDetailScreen({
  reasonId,
  mode,
}: {
  reasonId: string;
  mode: RecordPageMode;
}) {
  const router = useRouter();
  const { canUpdate } = useCrudPermissions(lostReasonPermissions);
  const reasonQuery = useLostReason(reasonId);
  const reason = reasonQuery.data;
  const isEdit = mode === "edit";
  const viewHref = `/lost-reasons/${reasonId}`;

  if (reasonQuery.isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (reasonQuery.isError || !reason) {
    return (
      <div className="flex flex-col gap-3">
        <DataTableError
          message={reasonQuery.error ? getErrorMessage(reasonQuery.error) : "Lost reason not found"}
          onRetry={() => reasonQuery.refetch()}
        />
        <Button type="button" variant="outline" asChild>
          <Link href="/lost-reasons">Back to lost reasons</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <RecordPageHeader
        title={reason.name}
        listHref="/lost-reasons"
        viewHref={viewHref}
        editHref={`${viewHref}/edit`}
        canUpdate={canUpdate}
        mode={mode}
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{isEdit ? "Edit lost reason" : "Lost reason"}</CardTitle>
        </CardHeader>
        <CardContent>
          <LostReasonForm
            reason={reason}
            disabled={!isEdit}
            onSuccess={() => router.push(viewHref)}
          />
        </CardContent>
      </Card>
    </div>
  );
}
