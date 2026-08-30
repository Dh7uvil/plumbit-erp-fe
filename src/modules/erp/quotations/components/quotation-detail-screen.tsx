"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { QuotationForm } from "@/modules/erp/quotations/components/quotation-form";
import { QuotationStatusBadge } from "@/modules/erp/quotations/components/quotation-status-badge";
import { QuotationWorkflowButtons } from "@/modules/erp/quotations/components/quotation-workflow-buttons";
import { quotationPermissions } from "@/modules/erp/quotations/permissions";
import { useQuotation } from "@/modules/erp/quotations/queries";
import { quotationDisplayNumber } from "@/modules/erp/quotations/schemas";
import { EntityAttachmentsPanel } from "@/modules/users-management/attachments/components/entity-attachments-panel";
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
import { formatDateTime } from "@/shared/lib/format";

export function QuotationDetailScreen({
  quotationId,
  mode,
}: {
  quotationId: string;
  mode: RecordPageMode;
}) {
  const router = useRouter();
  const { canUpdate } = useCrudPermissions(quotationPermissions);
  const quotationQuery = useQuotation(quotationId);
  const quotation = quotationQuery.data;
  const isDraft = quotation?.status === "DRAFT";
  const isEdit = mode === "edit";
  const viewHref = `/quotations/${quotationId}`;
  const canEditDraft = Boolean(isDraft && canUpdate);

  useEffect(() => {
    if (isEdit && quotation && quotation.status !== "DRAFT") {
      router.replace(viewHref);
    }
  }, [isEdit, quotation, router, viewHref]);

  if (quotationQuery.isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (quotationQuery.isError || !quotation) {
    return (
      <div className="flex flex-col gap-3">
        <DataTableError
          message={
            quotationQuery.error ? getErrorMessage(quotationQuery.error) : "Quotation not found"
          }
          onRetry={() => quotationQuery.refetch()}
        />
        <Button type="button" variant="outline" asChild>
          <Link href="/quotations">Back to quotations</Link>
        </Button>
      </div>
    );
  }

  const number = quotationDisplayNumber(quotation);

  return (
    <div className="flex flex-col gap-5">
      <RecordPageHeader
        title={number ?? "Quotation"}
        subtitle={number ? undefined : "Number not assigned yet"}
        listHref="/quotations"
        viewHref={viewHref}
        editHref={canEditDraft ? `${viewHref}/edit` : undefined}
        canUpdate={canEditDraft}
        mode={mode}
        extraActions={
          isEdit ? null : (
            <>
              <QuotationStatusBadge status={quotation.status} />
              <QuotationWorkflowButtons quotation={quotation} />
            </>
          )
        }
      />
      {quotation.status === "CONVERTED" ? (
        <p className="text-muted-foreground text-sm">
          Converted
          {quotation.converted_document_type ? ` to ${quotation.converted_document_type}` : ""}
          {quotation.converted_at ? ` on ${formatDateTime(quotation.converted_at)}` : ""}.
        </p>
      ) : null}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{isEdit ? "Edit quotation" : "Quotation"}</CardTitle>
        </CardHeader>
        <CardContent>
          <QuotationForm
            quotation={quotation}
            disabled={!isEdit}
            onSuccess={() => router.push(viewHref)}
          />
        </CardContent>
      </Card>
      {isEdit ? null : <EntityAttachmentsPanel entityType="QUOTATION" entityId={quotation.id} />}
    </div>
  );
}
