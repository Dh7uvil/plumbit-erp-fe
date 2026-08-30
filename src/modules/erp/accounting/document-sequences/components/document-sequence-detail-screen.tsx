"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { DocumentSequenceForm } from "@/modules/erp/accounting/document-sequences/components/document-sequence-form";
import { documentSequencePermissions } from "@/modules/erp/accounting/document-sequences/permissions";
import { useDocumentSequence } from "@/modules/erp/accounting/document-sequences/queries";
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

export function DocumentSequenceDetailScreen({
  sequenceId,
  mode,
}: {
  sequenceId: string;
  mode: RecordPageMode;
}) {
  const router = useRouter();
  const { canUpdate } = useCrudPermissions(documentSequencePermissions);
  const sequenceQuery = useDocumentSequence(sequenceId);
  const sequence = sequenceQuery.data;
  const isEdit = mode === "edit";
  const viewHref = `/document-sequences/${sequenceId}`;

  if (sequenceQuery.isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (sequenceQuery.isError || !sequence) {
    return (
      <div className="flex flex-col gap-3">
        <DataTableError
          message={
            sequenceQuery.error
              ? getErrorMessage(sequenceQuery.error)
              : "Document sequence not found"
          }
          onRetry={() => sequenceQuery.refetch()}
        />
        <Button type="button" variant="outline" asChild>
          <Link href="/document-sequences">Back to document sequences</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <RecordPageHeader
        title={`${sequence.document_type} · ${sequence.series}`}
        listHref="/document-sequences"
        viewHref={viewHref}
        editHref={`${viewHref}/edit`}
        canUpdate={canUpdate}
        mode={mode}
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {isEdit ? "Edit document sequence" : "Document sequence"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DocumentSequenceForm
            sequence={sequence}
            disabled={!isEdit}
            onSuccess={() => router.push(viewHref)}
          />
        </CardContent>
      </Card>
    </div>
  );
}
