"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { documentTypeLabel } from "@/modules/erp/accounting/document-sequences/schemas";
import { QuotationForm } from "@/modules/erp/quotations/components/quotation-form";
import { useQuotationWorkflow } from "@/modules/erp/quotations/hooks/use-quotation-workflow";
import { quotationPermissions } from "@/modules/erp/quotations/permissions";
import { useQuotation } from "@/modules/erp/quotations/queries";
import {
  QUOTATION_STATUS_LABELS,
  QUOTATION_STATUS_VARIANTS,
  quotationDisplayNumber,
  type Quotation,
} from "@/modules/erp/quotations/schemas";
import { QUOTATION_ACTION_REGISTRY } from "@/modules/erp/quotations/workflow";
import { ActivityFeed } from "@/modules/users-management/activity/components/activity-feed";
import { EntityAttachmentsPanel } from "@/modules/users-management/attachments/components/entity-attachments-panel";
import { useCrudPermissions } from "@/shared/auth/use-crud-permissions";
import { DocumentRecordShell } from "@/shared/components/document/document-record-shell";
import { DocumentStatusBadge } from "@/shared/components/document/document-status-badge";
import { DocumentWorkflowButtons } from "@/shared/components/document/document-workflow-buttons";
import type { RecordPageMode } from "@/shared/components/layout/record-page-header";
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

  if (quotationQuery.isLoading || quotationQuery.isError || !quotation) {
    return (
      <DocumentRecordShell
        isLoading={quotationQuery.isLoading}
        isError={quotationQuery.isError || !quotation}
        error={quotationQuery.error}
        notFoundMessage="Quotation not found"
        onRetry={() => quotationQuery.refetch()}
        backHref="/quotations"
        backLabel="Back to quotations"
        title="Quotation"
        listHref="/quotations"
        viewHref={viewHref}
        canUpdate={false}
        mode={mode}
        formTitle="Quotation"
      >
        {null}
      </DocumentRecordShell>
    );
  }

  return (
    <QuotationDetailLoaded
      quotation={quotation}
      mode={mode}
      canEditDraft={canEditDraft}
      viewHref={viewHref}
    />
  );
}

function QuotationDetailLoaded({
  quotation,
  mode,
  canEditDraft,
  viewHref,
}: {
  quotation: Quotation;
  mode: RecordPageMode;
  canEditDraft: boolean;
  viewHref: string;
}) {
  const router = useRouter();
  const isEdit = mode === "edit";
  const number = quotationDisplayNumber(quotation);
  const onAction = useQuotationWorkflow(quotation);

  return (
    <DocumentRecordShell
      isLoading={false}
      isError={false}
      notFoundMessage="Quotation not found"
      onRetry={() => undefined}
      backHref="/quotations"
      backLabel="Back to quotations"
      title={number ?? "Quotation"}
      subtitle={number ? undefined : "Number not assigned yet"}
      listHref="/quotations"
      viewHref={viewHref}
      editHref={canEditDraft ? `${viewHref}/edit` : undefined}
      canUpdate={canEditDraft}
      mode={mode}
      badges={
        <DocumentStatusBadge
          status={quotation.status}
          labels={QUOTATION_STATUS_LABELS}
          variants={QUOTATION_STATUS_VARIANTS}
        />
      }
      workflow={
        <DocumentWorkflowButtons
          availableActions={quotation.available_actions}
          registry={QUOTATION_ACTION_REGISTRY}
          documentKind="quotation"
          documentLabel={number ?? "quotation"}
          onAction={onAction}
        />
      }
      banner={
        quotation.status === "CONVERTED" || quotation.converted_document_id ? (
          <p className="text-muted-foreground text-sm">
            Converted
            {quotation.converted_document_type
              ? ` to ${documentTypeLabel(quotation.converted_document_type)}`
              : ""}
            {quotation.converted_at ? ` on ${formatDateTime(quotation.converted_at)}` : ""}
            {quotation.converted_document_id ? (
              <>
                {". "}
                <Link
                  href={`/sales-orders/${quotation.converted_document_id}`}
                  className="text-foreground underline-offset-4 hover:underline"
                >
                  Open sales order
                </Link>
              </>
            ) : (
              "."
            )}
          </p>
        ) : null
      }
      formTitle={isEdit ? "Edit quotation" : "Quotation"}
      attachments={
        <EntityAttachmentsPanel
          entityType="QUOTATION"
          entityId={quotation.id}
          parentPosted={quotation.is_posted}
        />
      }
      activity={
        <ActivityFeed entityType="quotation" entityId={quotation.id} revision={quotation.version} />
      }
    >
      <QuotationForm
        quotation={quotation}
        disabled={!isEdit}
        onSuccess={() => router.push(viewHref)}
      />
    </DocumentRecordShell>
  );
}
