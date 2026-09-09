"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { documentTypeLabel } from "@/modules/erp/accounting/document-sequences/schemas";
import { ConvertProformaToSalesOrderDialog } from "@/modules/erp/proforma-invoices/components/convert-to-sales-order-dialog";
import { ProformaInvoiceForm } from "@/modules/erp/proforma-invoices/components/proforma-invoice-form";
import { useProformaInvoiceWorkflow } from "@/modules/erp/proforma-invoices/hooks/use-proforma-invoice-workflow";
import { proformaInvoicePermissions } from "@/modules/erp/proforma-invoices/permissions";
import { useProformaInvoice } from "@/modules/erp/proforma-invoices/queries";
import {
  PROFORMA_INVOICE_STATUS_LABELS,
  PROFORMA_INVOICE_STATUS_VARIANTS,
  proformaInvoiceDisplayNumber,
  type ProformaInvoice,
} from "@/modules/erp/proforma-invoices/schemas";
import type { ProformaInvoiceWorkflowAction } from "@/modules/erp/proforma-invoices/workflow";
import { PROFORMA_INVOICE_ACTION_REGISTRY } from "@/modules/erp/proforma-invoices/workflow";
import { ActivityFeed } from "@/modules/users-management/activity/components/activity-feed";
import { EntityAttachmentsPanel } from "@/modules/users-management/attachments/components/entity-attachments-panel";
import { useCrudPermissions } from "@/shared/auth/use-crud-permissions";
import { DocumentRecordShell } from "@/shared/components/document/document-record-shell";
import { DocumentStatusBadge } from "@/shared/components/document/document-status-badge";
import {
  DocumentWorkflowButtons,
  type DocumentWorkflowExtras,
} from "@/shared/components/document/document-workflow-buttons";
import type { RecordPageMode } from "@/shared/components/layout/record-page-header";
import { formatDateTime, formatMoney } from "@/shared/lib/format";

export function ProformaInvoiceDetailScreen({
  proformaInvoiceId,
  mode,
}: {
  proformaInvoiceId: string;
  mode: RecordPageMode;
}) {
  const router = useRouter();
  const { canUpdate } = useCrudPermissions(proformaInvoicePermissions);
  const invoiceQuery = useProformaInvoice(proformaInvoiceId);
  const invoice = invoiceQuery.data;
  const isDraft = invoice?.status === "DRAFT";
  const isEdit = mode === "edit";
  const viewHref = `/proforma-invoices/${proformaInvoiceId}`;
  const canEditDraft = Boolean(isDraft && canUpdate);

  useEffect(() => {
    if (isEdit && invoice && invoice.status !== "DRAFT") {
      router.replace(viewHref);
    }
  }, [isEdit, invoice, router, viewHref]);

  if (invoiceQuery.isLoading || invoiceQuery.isError || !invoice) {
    return (
      <DocumentRecordShell
        isLoading={invoiceQuery.isLoading}
        isError={invoiceQuery.isError || !invoice}
        error={invoiceQuery.error}
        notFoundMessage="Proforma invoice not found"
        onRetry={() => invoiceQuery.refetch()}
        backHref="/proforma-invoices"
        backLabel="Back to proforma invoices"
        title="Proforma invoice"
        listHref="/proforma-invoices"
        viewHref={viewHref}
        canUpdate={false}
        mode={mode}
        formTitle="Proforma invoice"
      >
        {null}
      </DocumentRecordShell>
    );
  }

  return (
    <ProformaInvoiceDetailLoaded
      invoice={invoice}
      mode={mode}
      canEditDraft={canEditDraft}
      viewHref={viewHref}
    />
  );
}

function ProformaInvoiceDetailLoaded({
  invoice,
  mode,
  canEditDraft,
  viewHref,
}: {
  invoice: ProformaInvoice;
  mode: RecordPageMode;
  canEditDraft: boolean;
  viewHref: string;
}) {
  const router = useRouter();
  const isEdit = mode === "edit";
  const number = proformaInvoiceDisplayNumber(invoice);
  const onAction = useProformaInvoiceWorkflow(invoice);
  const [convertOpen, setConvertOpen] = useState(false);

  async function handleAction(
    action: ProformaInvoiceWorkflowAction,
    extras: DocumentWorkflowExtras,
  ) {
    if (action === "convert") {
      setConvertOpen(true);
      return;
    }
    await onAction(action, extras);
  }

  return (
    <DocumentRecordShell
      isLoading={false}
      isError={false}
      notFoundMessage="Proforma invoice not found"
      onRetry={() => undefined}
      backHref="/proforma-invoices"
      backLabel="Back to proforma invoices"
      title={number ?? "Proforma invoice"}
      subtitle={number ? undefined : "Number not assigned yet"}
      listHref="/proforma-invoices"
      viewHref={viewHref}
      editHref={canEditDraft ? `${viewHref}/edit` : undefined}
      canUpdate={canEditDraft}
      mode={mode}
      badges={
        <DocumentStatusBadge
          status={invoice.status}
          labels={PROFORMA_INVOICE_STATUS_LABELS}
          variants={PROFORMA_INVOICE_STATUS_VARIANTS}
        />
      }
      workflow={
        <DocumentWorkflowButtons
          availableActions={invoice.available_actions}
          registry={PROFORMA_INVOICE_ACTION_REGISTRY}
          documentKind="proforma invoice"
          documentLabel={number ?? "proforma invoice"}
          onAction={handleAction}
        />
      }
      banner={
        <div className="flex flex-col gap-1">
          {invoice.source_quotation_id ? (
            <p className="text-muted-foreground text-sm">
              Raised from{" "}
              <Link
                href={`/quotations/${invoice.source_quotation_id}`}
                className="text-foreground underline-offset-4 hover:underline"
              >
                quotation
              </Link>
              .
            </p>
          ) : null}
          {invoice.status === "CONVERTED" || invoice.converted_document_id ? (
            <p className="text-muted-foreground text-sm">
              Converted
              {invoice.converted_document_type
                ? ` to ${documentTypeLabel(invoice.converted_document_type)}`
                : ""}
              {invoice.converted_at ? ` on ${formatDateTime(invoice.converted_at)}` : ""}
              {invoice.converted_document_id ? (
                <>
                  {". "}
                  <Link
                    href={`/sales-orders/${invoice.converted_document_id}`}
                    className="text-foreground underline-offset-4 hover:underline"
                  >
                    Open sales order
                  </Link>
                </>
              ) : (
                "."
              )}
            </p>
          ) : null}
          {invoice.advance_required_amount && invoice.advance_required_amount !== "0" ? (
            <p className="text-muted-foreground text-sm">
              Advance required {formatMoney(invoice.advance_required_amount, "")}.
            </p>
          ) : null}
        </div>
      }
      formTitle={isEdit ? "Edit proforma invoice" : "Proforma invoice"}
      attachments={
        <EntityAttachmentsPanel
          entityType="PROFORMA_INVOICE"
          entityId={invoice.id}
          parentPosted={invoice.is_posted}
        />
      }
      activity={
        <ActivityFeed
          entityType="proforma_invoice"
          entityId={invoice.id}
          revision={invoice.version}
        />
      }
    >
      <ProformaInvoiceForm
        invoice={invoice}
        disabled={!isEdit}
        onSuccess={() => router.push(viewHref)}
      />
      <ConvertProformaToSalesOrderDialog
        invoice={invoice}
        open={convertOpen}
        onOpenChange={setConvertOpen}
      />
    </DocumentRecordShell>
  );
}
