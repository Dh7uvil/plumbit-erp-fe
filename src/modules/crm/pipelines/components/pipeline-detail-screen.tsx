"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { PipelineForm } from "@/modules/crm/pipelines/components/pipeline-form";
import { PipelineStagesPanel } from "@/modules/crm/pipelines/components/pipeline-stages-panel";
import { pipelinePermissions } from "@/modules/crm/pipelines/permissions";
import { usePipeline } from "@/modules/crm/pipelines/queries";
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

export function PipelineDetailScreen({
  pipelineId,
  mode,
}: {
  pipelineId: string;
  mode: RecordPageMode;
}) {
  const router = useRouter();
  const { canUpdate } = useCrudPermissions(pipelinePermissions);
  const pipelineQuery = usePipeline(pipelineId);
  const pipeline = pipelineQuery.data;
  const isEdit = mode === "edit";
  const viewHref = `/pipelines/${pipelineId}`;

  if (pipelineQuery.isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (pipelineQuery.isError || !pipeline) {
    return (
      <div className="flex flex-col gap-3">
        <DataTableError
          message={
            pipelineQuery.error ? getErrorMessage(pipelineQuery.error) : "Pipeline not found"
          }
          onRetry={() => pipelineQuery.refetch()}
        />
        <Button type="button" variant="outline" asChild>
          <Link href="/pipelines">Back to pipelines</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <RecordPageHeader
        title={pipeline.name}
        listHref="/pipelines"
        viewHref={viewHref}
        editHref={`${viewHref}/edit`}
        canUpdate={canUpdate}
        mode={mode}
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{isEdit ? "Edit pipeline" : "Pipeline"}</CardTitle>
        </CardHeader>
        <CardContent>
          <PipelineForm
            pipeline={pipeline}
            disabled={!isEdit}
            onSuccess={() => router.push(viewHref)}
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Stages</CardTitle>
        </CardHeader>
        <CardContent>
          <PipelineStagesPanel pipeline={pipeline} canUpdate={canUpdate && !isEdit} />
        </CardContent>
      </Card>
    </div>
  );
}
