"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { CreateProformaInvoiceDialog } from "@/modules/erp/quotations/components/create-proforma-invoice-dialog";
import { CreateSalesInvoiceFromQuotationDialog } from "@/modules/erp/quotations/components/create-sales-invoice-dialog";
import { QuotationForm } from "@/modules/erp/quotations/components/quotation-form";
import { QuotationRevisionsPanel } from "@/modules/erp/quotations/components/quotation-revisions-panel";
import { useQuotationWorkflow } from "@/modules/erp/quotations/hooks/use-quotation-workflow";
import { quotationPermissions } from "@/modules/erp/quotations/permissions";
import { useQuotation } from "@/modules/erp/quotations/queries";
import {
  QUOTATION_STATUS_LABELS,
  QUOTATION_STATUS_VARIANTS,
  TAX_TREATMENT_LABELS,
  quotationDisplayNumber,
  type Quotation,
} from "@/modules/erp/quotations/schemas";
import type { QuotationWorkflowAction } from "@/modules/erp/quotations/workflow";
import { QUOTATION_ACTION_REGISTRY } from "@/modules/erp/quotations/workflow";
import { ActivityFeed } from "@/modules/users-management/activity/components/activity-feed";
import { EntityAttachmentsPanel } from "@/modules/users-management/attachments/components/entity-attachments-panel";
import { useCrudPermissions } from "@/shared/auth/use-crud-permissions";
import { AppliedCommercialTerms } from "@/shared/components/document/applied-commercial-terms";
import { DocumentRecordShell } from "@/shared/components/document/document-record-shell";
import { DocumentStatusBadge } from "@/shared/components/document/document-status-badge";
import {
  DocumentWorkflowButtons,
  type DocumentWorkflowExtras,
} from "@/shared/components/document/document-workflow-buttons";
import { hasRelatedDocumentType } from "@/shared/components/document/document-links";
import { RelatedDocumentsCard } from "@/shared/components/document/related-documents-card";
import { ConfirmActionDialog } from "@/shared/components/feedback/confirm-action-dialog";
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
  const [createPfiOpen, setCreatePfiOpen] = useState(false);
  const [createInvoiceOpen, setCreateInvoiceOpen] = useState(false);
  const [directInvoiceConfirm, setDirectInvoiceConfirm] = useState(false);
  const hasSalesOrder = hasRelatedDocumentType(quotation.related_documents, "SALES_ORDER");

  async function handleAction(action: QuotationWorkflowAction, extras: DocumentWorkflowExtras) {
    if (action === "create_proforma") {
      setCreatePfiOpen(true);
      return;
    }
    if (action === "create_sales_invoice") {
      if (!hasSalesOrder) {
        setDirectInvoiceConfirm(true);
        return;
      }
      setCreateInvoiceOpen(true);
      return;
    }
    await onAction(action, extras);
  }

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
          onAction={handleAction}
        />
      }
      banner={
        <div className="flex flex-col gap-2">
          <AppliedCommercialTerms
            currencyId={quotation.currency_id}
            exchangeRate={quotation.exchange_rate}
            taxTreatmentLabel={TAX_TREATMENT_LABELS[quotation.tax_treatment]}
            paymentTermsId={quotation.payment_terms_id}
          />
          {quotation.status === "PARTIALLY_CONVERTED" ? (
            <p className="text-muted-foreground text-sm">
              Partially converted
              {quotation.converted_at ? ` as of ${formatDateTime(quotation.converted_at)}` : ""}.
            </p>
          ) : quotation.status === "CONVERTED" ? (
            <p className="text-muted-foreground text-sm">
              Converted
              {quotation.converted_at ? ` on ${formatDateTime(quotation.converted_at)}` : ""}.
            </p>
          ) : null}
        </div>
      }
      formTitle={isEdit ? "Edit quotation" : "Quotation"}
      panels={
        <>
          <RelatedDocumentsCard documents={quotation.related_documents} />
          <QuotationRevisionsPanel quotation={quotation} />
        </>
      }
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
      <CreateProformaInvoiceDialog
        quotation={quotation}
        open={createPfiOpen}
        onOpenChange={setCreatePfiOpen}
      />
      <CreateSalesInvoiceFromQuotationDialog
        quotation={quotation}
        open={createInvoiceOpen}
        onOpenChange={setCreateInvoiceOpen}
      />
      <ConfirmActionDialog
        open={directInvoiceConfirm}
        title="Create sales invoice"
        description="This quotation has not been converted to a Sales Order. Create Sales Invoice directly?"
        confirmLabel="Continue"
        variant="default"
        onOpenChange={(open) => {
          if (!open) {
            setDirectInvoiceConfirm(false);
          }
        }}
        onConfirm={() => {
          setDirectInvoiceConfirm(false);
          setCreateInvoiceOpen(true);
        }}
      />
    </DocumentRecordShell>
  );
}
