"use client";

import Link from "next/link";

import { QuotationForm } from "@/modules/erp/quotations/components/quotation-form";
import { QuotationStatusBadge } from "@/modules/erp/quotations/components/quotation-status-badge";
import { QuotationWorkflowButtons } from "@/modules/erp/quotations/components/quotation-workflow-buttons";
import { quotationPermissions } from "@/modules/erp/quotations/permissions";
import { useQuotation } from "@/modules/erp/quotations/queries";
import { quotationDisplayNumber } from "@/modules/erp/quotations/schemas";
import { EntityAttachmentsPanel } from "@/modules/users-management/attachments/components/entity-attachments-panel";
import { getErrorMessage } from "@/shared/api/errors";
import { DataTableError } from "@/shared/components/data-table/states";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { formatDateTime } from "@/shared/lib/format";
import { useCan } from "@/shared/providers/session-provider";

export function QuotationDetailScreen({ quotationId }: { quotationId: string }) {
  const can = useCan();
  const quotationQuery = useQuotation(quotationId);
  const quotation = quotationQuery.data;
  const canUpdate = can(quotationPermissions.update);
  const isDraft = quotation?.status === "DRAFT";
  const editable = Boolean(quotation) && isDraft && canUpdate;

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
      <PageHeader
        title={number ?? "Quotation"}
        subtitle={number ? undefined : "Number not assigned yet"}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <QuotationStatusBadge status={quotation.status} />
            <QuotationWorkflowButtons quotation={quotation} />
            <Button type="button" variant="outline" size="sm" asChild>
              <Link href="/quotations">Back</Link>
            </Button>
          </div>
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
          <CardTitle className="text-base">{editable ? "Edit quotation" : "Quotation"}</CardTitle>
        </CardHeader>
        <CardContent>
          <QuotationForm quotation={quotation} disabled={!editable} />
        </CardContent>
      </Card>
      <EntityAttachmentsPanel entityType="QUOTATION" entityId={quotation.id} />
    </div>
  );
}
