"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useAllCurrencies } from "@/modules/erp/currencies/queries";
import { AllocateCustomerPaymentDialog } from "@/modules/erp/customer-payments/components/allocate-customer-payment-dialog";
import { CustomerPaymentForm } from "@/modules/erp/customer-payments/components/customer-payment-form";
import { useCustomerPaymentWorkflow } from "@/modules/erp/customer-payments/hooks/use-customer-payment-workflow";
import { customerPaymentPermissions } from "@/modules/erp/customer-payments/permissions";
import { useCustomerPayment } from "@/modules/erp/customer-payments/queries";
import {
  INVOICE_DOCUMENT_STATUS_LABELS,
  INVOICE_DOCUMENT_STATUS_VARIANTS,
  PAYMENT_METHOD_LABELS,
  customerPaymentDisplayNumber,
  type CustomerPayment,
} from "@/modules/erp/customer-payments/schemas";
import { customerPaymentActionRegistry } from "@/modules/erp/customer-payments/workflow";
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

export function CustomerPaymentDetailScreen({
  paymentId,
  mode,
}: {
  paymentId: string;
  mode: RecordPageMode;
}) {
  const router = useRouter();
  const { canUpdate } = useCrudPermissions(customerPaymentPermissions);
  const paymentQuery = useCustomerPayment(paymentId);
  const payment = paymentQuery.data;
  const isDraft = payment?.status === "DRAFT";
  const isEdit = mode === "edit";
  const viewHref = `/customer-payments/${paymentId}`;
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
        notFoundMessage="Receipt not found"
        onRetry={() => paymentQuery.refetch()}
        backHref="/customer-payments"
        backLabel="Back to receipts"
        title="Customer receipt"
        listHref="/customer-payments"
        viewHref={viewHref}
        canUpdate={false}
        mode={mode}
        formTitle="Customer receipt"
      >
        {null}
      </DocumentRecordShell>
    );
  }

  return (
    <CustomerPaymentDetailLoaded
      payment={payment}
      mode={mode}
      canEditDraft={canEditDraft}
      viewHref={viewHref}
    />
  );
}

function CustomerPaymentDetailLoaded({
  payment,
  mode,
  canEditDraft,
  viewHref,
}: {
  payment: CustomerPayment;
  mode: RecordPageMode;
  canEditDraft: boolean;
  viewHref: string;
}) {
  const router = useRouter();
  const isEdit = mode === "edit";
  const number = customerPaymentDisplayNumber(payment);
  const [allocateOpen, setAllocateOpen] = useState(false);
  const onAction = useCustomerPaymentWorkflow(payment, () => setAllocateOpen(true));
  const [writeError, setWriteError] = useState<unknown>(null);
  const currenciesQuery = useAllCurrencies();
  const currencyCode =
    currenciesQuery.data?.find((currency) => currency.id === payment.currency_id)?.code ?? "";

  return (
    <DocumentRecordShell
      isLoading={false}
      isError={false}
      notFoundMessage="Receipt not found"
      onRetry={() => undefined}
      backHref="/customer-payments"
      backLabel="Back to receipts"
      title={number ?? "Customer receipt"}
      subtitle={number ? undefined : "Number not assigned yet"}
      listHref="/customer-payments"
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
          registry={customerPaymentActionRegistry(payment)}
          documentKind="receipt"
          documentLabel={number ?? "receipt"}
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
      formTitle={isEdit ? "Edit receipt" : "Customer receipt"}
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
          entityType="CUSTOMER_PAYMENT"
          entityId={payment.id}
          parentPosted={payment.is_posted}
          defaultCategory="PAYMENT_PROOF"
        />
      }
      activity={
        <ActivityFeed
          entityType="customer_payment"
          entityId={payment.id}
          revision={payment.version}
        />
      }
    >
      <CustomerPaymentForm
        payment={payment}
        disabled={!isEdit}
        onSuccess={() => router.push(viewHref)}
      />
      <AllocateCustomerPaymentDialog
        payment={payment}
        currencyCode={currencyCode}
        open={allocateOpen}
        onOpenChange={setAllocateOpen}
      />
    </DocumentRecordShell>
  );
}
