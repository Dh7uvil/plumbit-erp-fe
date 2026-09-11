"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useAllCurrencies } from "@/modules/erp/currencies/queries";
import { AllocateSupplierPaymentDialog } from "@/modules/erp/supplier-payments/components/allocate-supplier-payment-dialog";
import { SupplierPaymentForm } from "@/modules/erp/supplier-payments/components/supplier-payment-form";
import { useSupplierPaymentWorkflow } from "@/modules/erp/supplier-payments/hooks/use-supplier-payment-workflow";
import { supplierPaymentPermissions } from "@/modules/erp/supplier-payments/permissions";
import { useSupplierPayment } from "@/modules/erp/supplier-payments/queries";
import {
  INVOICE_DOCUMENT_STATUS_LABELS,
  INVOICE_DOCUMENT_STATUS_VARIANTS,
  PAYMENT_METHOD_LABELS,
  supplierPaymentDisplayNumber,
  type SupplierPayment,
} from "@/modules/erp/supplier-payments/schemas";
import { SUPPLIER_PAYMENT_ACTION_REGISTRY } from "@/modules/erp/supplier-payments/workflow";
import {
  StockWriteAlert,
  isStockWriteAlertError,
} from "@/modules/erp/period-lock/components/stock-write-alert";
import { ActivityFeed } from "@/modules/users-management/activity/components/activity-feed";
import { EntityAttachmentsPanel } from "@/modules/users-management/attachments/components/entity-attachments-panel";
import { useCrudPermissions } from "@/shared/auth/use-crud-permissions";
import { AppliedCommercialTerms } from "@/shared/components/document/applied-commercial-terms";
import { DocumentLedgerCard } from "@/shared/components/document/document-ledger-card";
import { DocumentRecordShell } from "@/shared/components/document/document-record-shell";
import { DocumentStatusBadge } from "@/shared/components/document/document-status-badge";
import { DocumentWorkflowButtons } from "@/shared/components/document/document-workflow-buttons";
import { RelatedDocumentsCard } from "@/shared/components/document/related-documents-card";
import type { RecordPageMode } from "@/shared/components/layout/record-page-header";
import { formatMoney } from "@/shared/lib/format";

export function SupplierPaymentDetailScreen({
  paymentId,
  mode,
}: {
  paymentId: string;
  mode: RecordPageMode;
}) {
  const router = useRouter();
  const { canUpdate } = useCrudPermissions(supplierPaymentPermissions);
  const paymentQuery = useSupplierPayment(paymentId);
  const payment = paymentQuery.data;
  const isDraft = payment?.status === "DRAFT";
  const isEdit = mode === "edit";
  const viewHref = `/supplier-payments/${paymentId}`;
  const canEditDraft = Boolean(isDraft && canUpdate);

  useEffect(() => {
    if (isEdit && payment && payment.status !== "DRAFT") {
      router.replace(viewHref);
    }
  }, [isEdit, payment, router, viewHref]);

  if (paymentQuery.isLoading || paymentQuery.isError || !payment) {
    return (
      <DocumentRecordShell
        isLoading={paymentQuery.isLoading}
        isError={paymentQuery.isError || !payment}
        error={paymentQuery.error}
        notFoundMessage="Payment not found"
        onRetry={() => paymentQuery.refetch()}
        backHref="/supplier-payments"
        backLabel="Back to payments"
        title="Supplier payment"
        listHref="/supplier-payments"
        viewHref={viewHref}
        canUpdate={false}
        mode={mode}
        formTitle="Supplier payment"
      >
        {null}
      </DocumentRecordShell>
    );
  }

  return (
    <SupplierPaymentDetailLoaded
      payment={payment}
      mode={mode}
      canEditDraft={canEditDraft}
      viewHref={viewHref}
    />
  );
}

function SupplierPaymentDetailLoaded({
  payment,
  mode,
  canEditDraft,
  viewHref,
}: {
  payment: SupplierPayment;
  mode: RecordPageMode;
  canEditDraft: boolean;
  viewHref: string;
}) {
  const router = useRouter();
  const isEdit = mode === "edit";
  const number = supplierPaymentDisplayNumber(payment);
  const [allocateOpen, setAllocateOpen] = useState(false);
  const onAction = useSupplierPaymentWorkflow(payment, () => setAllocateOpen(true));
  const [writeError, setWriteError] = useState<unknown>(null);
  const currenciesQuery = useAllCurrencies();
  const currencyCode =
    currenciesQuery.data?.find((currency) => currency.id === payment.currency_id)?.code ?? "";

  return (
    <DocumentRecordShell
      isLoading={false}
      isError={false}
      notFoundMessage="Payment not found"
      onRetry={() => undefined}
      backHref="/supplier-payments"
      backLabel="Back to payments"
      title={number ?? "Supplier payment"}
      subtitle={number ? undefined : "Number not assigned yet"}
      listHref="/supplier-payments"
      viewHref={viewHref}
      editHref={canEditDraft ? `${viewHref}/edit` : undefined}
      canUpdate={canEditDraft}
      mode={mode}
      badges={
        <DocumentStatusBadge
          status={payment.status}
          labels={INVOICE_DOCUMENT_STATUS_LABELS}
          variants={INVOICE_DOCUMENT_STATUS_VARIANTS}
        />
      }
      workflow={
        <DocumentWorkflowButtons
          availableActions={payment.available_actions}
          registry={SUPPLIER_PAYMENT_ACTION_REGISTRY}
          documentKind="payment"
          documentLabel={number ?? "payment"}
          extra={<StockWriteAlert error={writeError} />}
          onError={(error) => {
            if (isStockWriteAlertError(error)) {
              setWriteError(error);
              return true;
            }
            return false;
          }}
          onAction={async (action, extras) => {
            setWriteError(null);
            await onAction(action, extras);
          }}
        />
      }
      banner={
        <div className="flex flex-col gap-2">
          <AppliedCommercialTerms
            currencyId={payment.currency_id}
            exchangeRate={payment.exchange_rate}
            taxTreatmentLabel=""
          />
          <p className="text-muted-foreground text-sm">
            {PAYMENT_METHOD_LABELS[payment.payment_method]}
            {payment.reference ? ` · ${payment.reference}` : ""}
            {" · Unapplied "}
            {formatMoney(payment.amount_unapplied, currencyCode)}
            {payment.amount_refunded !== "0" ? (
              <> · Refunded {formatMoney(payment.amount_refunded, currencyCode)}</>
            ) : null}
            {payment.realized_fx_amount && payment.realized_fx_amount !== "0" ? (
              <> · Realized FX {formatMoney(payment.realized_fx_amount, currencyCode)}</>
            ) : null}
            .
          </p>
        </div>
      }
      formTitle={isEdit ? "Edit payment" : "Supplier payment"}
      panels={
        <>
          <RelatedDocumentsCard documents={payment.related_documents} />
          <DocumentLedgerCard
            journalEntryId={payment.journal_entry_id}
            reversalJournalEntryId={payment.reversal_journal_entry_id}
          />
        </>
      }
      attachments={
        <EntityAttachmentsPanel
          entityType="SUPPLIER_PAYMENT"
          entityId={payment.id}
          parentPosted={payment.is_posted}
          defaultCategory="PAYMENT_PROOF"
        />
      }
      activity={
        <ActivityFeed
          entityType="supplier_payment"
          entityId={payment.id}
          revision={payment.version}
        />
      }
    >
      <SupplierPaymentForm
        payment={payment}
        disabled={!isEdit}
        onSuccess={() => router.push(viewHref)}
      />
      <AllocateSupplierPaymentDialog
        payment={payment}
        currencyCode={currencyCode}
        open={allocateOpen}
        onOpenChange={setAllocateOpen}
      />
    </DocumentRecordShell>
  );
}
