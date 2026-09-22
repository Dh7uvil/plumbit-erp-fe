"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useAllCurrencies } from "@/modules/erp/currencies/queries";
import { CreateDebitNoteDialog } from "@/modules/erp/debit-notes/components/create-from-source-dialog";
import { InvoiceDebitNotesCard } from "@/modules/erp/debit-notes/components/invoice-debit-notes-card";
import {
  StockWriteAlert,
  isStockWriteAlertError,
} from "@/modules/erp/period-lock/components/stock-write-alert";
import { ComposeFromBillsDialog } from "@/modules/erp/landed-costs/components/compose-from-bills-dialog";
import { isUsableExpenseChargeLine } from "@/modules/erp/landed-costs/schemas";
import { ApplyDebitsDialog } from "@/modules/erp/purchase-invoices/components/apply-debits-dialog";
import { PurchaseInvoiceWriteOffDialog } from "@/modules/erp/purchase-invoices/components/write-off-dialog";
import { PurchaseOrderCycleCard } from "@/modules/erp/purchase-orders/components/purchase-order-cycle-card";
import { PurchaseInvoiceForm } from "@/modules/erp/purchase-invoices/components/purchase-invoice-form";
import { PurchaseInvoiceLandedCostCard } from "@/modules/erp/purchase-invoices/components/purchase-invoice-landed-cost-card";
import { PurchaseInvoiceReverseChargeCard } from "@/modules/erp/purchase-invoices/components/purchase-invoice-reverse-charge-card";
import { usePurchaseInvoiceWorkflow } from "@/modules/erp/purchase-invoices/hooks/use-purchase-invoice-workflow";
import { purchaseInvoicePermissions } from "@/modules/erp/purchase-invoices/permissions";
import { usePurchaseInvoice } from "@/modules/erp/purchase-invoices/queries";
import {
  BILL_TYPE_LABELS,
  INVOICE_DOCUMENT_STATUS_LABELS,
  INVOICE_DOCUMENT_STATUS_VARIANTS,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_VARIANTS,
  TAX_TREATMENT_LABELS,
  purchaseInvoiceDisplayNumber,
  type PurchaseInvoice,
} from "@/modules/erp/purchase-invoices/schemas";
import { PURCHASE_INVOICE_ACTION_REGISTRY } from "@/modules/erp/purchase-invoices/workflow";
import { EntityAttachmentsPanel } from "@/modules/users-management/attachments/components/entity-attachments-panel";
import { useCrudPermissions } from "@/shared/auth/use-crud-permissions";
import { AppliedCommercialTerms } from "@/shared/components/document/applied-commercial-terms";
import { DocumentLedgerCard } from "@/shared/components/document/document-ledger-card";
import { DocumentRecordShell } from "@/shared/components/document/document-record-shell";
import { printHref } from "@/shared/lib/print";
import { DocumentSettlementCard } from "@/shared/components/document/document-settlement-card";
import { DocumentStatusBadge } from "@/shared/components/document/document-status-badge";
import { RelatedDocumentsCard } from "@/shared/components/document/related-documents-card";
import { DocumentWorkflowButtons } from "@/shared/components/document/document-workflow-buttons";
import { appendMissingActions } from "@/shared/components/document/workflow-registry";
import type { RecordPageMode } from "@/shared/components/layout/record-page-header";
import { formatDate } from "@/shared/lib/format";

export function PurchaseInvoiceDetailScreen({
  invoiceId,
  mode,
}: {
  invoiceId: string;
  mode: RecordPageMode;
}) {
  const router = useRouter();
  const { canUpdate } = useCrudPermissions(purchaseInvoicePermissions);
  const invoiceQuery = usePurchaseInvoice(invoiceId);
  const invoice = invoiceQuery.data;
  const isDraft = invoice?.status === "DRAFT";
  const isEdit = mode === "edit";
  const viewHref = `/purchase-invoices/${invoiceId}`;
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
        notFoundMessage="Purchase invoice not found"
        onRetry={() => invoiceQuery.refetch()}
        backHref="/purchases?tab=bills"
        backLabel="Back to purchases"
        title="Purchase invoice"
        listHref="/purchases?tab=bills"
        viewHref={viewHref}
        canUpdate={false}
        mode={mode}
        formTitle="Purchase invoice"
      >
        {null}
      </DocumentRecordShell>
    );
  }

  return (
    <PurchaseInvoiceDetailLoaded
      invoice={invoice}
      mode={mode}
      canEditDraft={canEditDraft}
      viewHref={viewHref}
    />
  );
}

function PurchaseInvoiceDetailLoaded({
  invoice,
  mode,
  canEditDraft,
  viewHref,
}: {
  invoice: PurchaseInvoice;
  mode: RecordPageMode;
  canEditDraft: boolean;
  viewHref: string;
}) {
  const router = useRouter();
  const isEdit = mode === "edit";
  const number = purchaseInvoiceDisplayNumber(invoice);
  const onAction = usePurchaseInvoiceWorkflow(invoice);
  const [writeError, setWriteError] = useState<unknown>(null);
  const [debitOpen, setDebitOpen] = useState(false);
  const [applyDebitsOpen, setApplyDebitsOpen] = useState(false);
  const [writeOffOpen, setWriteOffOpen] = useState(false);
  const [landedCostOpen, setLandedCostOpen] = useState(false);
  const currenciesQuery = useAllCurrencies();
  const currencyCode =
    currenciesQuery.data?.find((currency) => currency.id === invoice.currency_id)?.code ?? "";
  const hasUsableExpense = invoice.lines.some(isUsableExpenseChargeLine);
  const fallbackActions: string[] = [];
  if (invoice.status === "POSTED") {
    fallbackActions.push("create_debit_note");
    if (hasUsableExpense) {
      fallbackActions.push("create_landed_cost");
    }
  }
  const workflowActions = appendMissingActions(invoice.available_actions, fallbackActions).filter(
    (action) => action !== "create_landed_cost" || hasUsableExpense,
  );

  return (
    <DocumentRecordShell
      isLoading={false}
      isError={false}
      notFoundMessage="Purchase invoice not found"
      onRetry={() => undefined}
      backHref="/purchases?tab=bills"
      backLabel="Back to purchases"
      title={number ?? "Purchase invoice"}
      subtitle={number ? undefined : "Number not assigned yet"}
      listHref="/purchases?tab=bills"
      viewHref={viewHref}
      printHref={printHref("purchase-invoices", invoice.id)}
      editHref={canEditDraft ? `${viewHref}/edit` : undefined}
      canUpdate={canEditDraft}
      mode={mode}
      badges={
        <>
          <DocumentStatusBadge
            kind="Document"
            status={invoice.status}
            labels={INVOICE_DOCUMENT_STATUS_LABELS}
            variants={INVOICE_DOCUMENT_STATUS_VARIANTS}
          />
          <DocumentStatusBadge
            kind="Payment"
            status={invoice.payment_status}
            labels={PAYMENT_STATUS_LABELS}
            variants={PAYMENT_STATUS_VARIANTS}
          />
          {invoice.is_overdue ? (
            <DocumentStatusBadge
              kind="Overdue"
              status="OVERDUE"
              labels={{ OVERDUE: "Overdue" }}
              variants={{ OVERDUE: "destructive" }}
            />
          ) : null}
          {invoice.is_fully_debited ? (
            <DocumentStatusBadge
              kind="Debit"
              status="DEBITED"
              labels={{ DEBITED: "Debited" }}
              variants={{ DEBITED: "secondary" }}
            />
          ) : invoice.is_partially_debited ? (
            <DocumentStatusBadge
              kind="Debit"
              status="PARTIALLY_DEBITED"
              labels={{ PARTIALLY_DEBITED: "Partially debited" }}
              variants={{ PARTIALLY_DEBITED: "warning" }}
            />
          ) : null}
        </>
      }
      workflow={
        <DocumentWorkflowButtons
          availableActions={workflowActions}
          registry={PURCHASE_INVOICE_ACTION_REGISTRY}
          documentKind="purchase invoice"
          documentLabel={number ?? "purchase invoice"}
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
            if (action === "pay_bill") {
              router.push(
                `/supplier-payments/new?supplier_id=${invoice.supplier_id}&invoice_id=${invoice.id}&currency_id=${invoice.currency_id}`,
              );
              return;
            }
            if (action === "apply_debits") {
              setApplyDebitsOpen(true);
              return;
            }
            if (action === "create_debit_note") {
              setDebitOpen(true);
              return;
            }
            if (action === "create_landed_cost") {
              setLandedCostOpen(true);
              return;
            }
            if (action === "write_off") {
              setWriteOffOpen(true);
              return;
            }
            await onAction(action, extras);
          }}
        />
      }
      banner={
        <div className="flex flex-col gap-2">
          <AppliedCommercialTerms
            currencyId={invoice.currency_id}
            exchangeRate={invoice.exchange_rate}
            taxTreatmentLabel={TAX_TREATMENT_LABELS[invoice.tax_treatment]}
            paymentTermsId={invoice.payment_terms_id}
          />
          <p className="text-muted-foreground text-sm">
            {BILL_TYPE_LABELS[invoice.bill_type]} bill
            {invoice.purchase_order_id ? (
              <>
                {" · "}
                <Link
                  href={`/purchase-orders/${invoice.purchase_order_id}`}
                  className="text-foreground underline-offset-4 hover:underline"
                >
                  purchase order
                </Link>
              </>
            ) : null}
            {invoice.goods_receipt_id ? (
              <>
                {" · "}
                <Link
                  href={`/goods-receipts/${invoice.goods_receipt_id}`}
                  className="text-foreground underline-offset-4 hover:underline"
                >
                  goods receipt
                </Link>
              </>
            ) : null}
            {invoice.due_date ? ` · Due ${formatDate(invoice.due_date)}` : ""}.
          </p>
        </div>
      }
      formTitle={isEdit ? "Edit purchase invoice" : "Purchase invoice"}
      panels={
        <>
          {invoice.purchase_order_id ? (
            <PurchaseOrderCycleCard purchaseOrderId={invoice.purchase_order_id} />
          ) : null}
          <DocumentSettlementCard
            amountPaid={invoice.amount_paid}
            amountAdjusted={invoice.amount_debited}
            adjustedLabel="Amount debited"
            amountWrittenOff={invoice.amount_written_off}
            balanceDue={invoice.balance_due}
            currencyCode={currencyCode}
          />
          <RelatedDocumentsCard documents={invoice.related_documents} />
          <PurchaseInvoiceLandedCostCard invoice={invoice} />
          <PurchaseInvoiceReverseChargeCard invoice={invoice} currencyCode={currencyCode} />
          <DocumentLedgerCard
            journalEntryId={invoice.journal_entry_id}
            reversalJournalEntryId={invoice.reversal_journal_entry_id}
          />
          <InvoiceDebitNotesCard purchaseInvoiceId={invoice.id} />
        </>
      }
      attachments={
        <EntityAttachmentsPanel
          entityType="PURCHASE_INVOICE"
          entityId={invoice.id}
          parentPosted={invoice.is_posted}
          defaultCategory="SUPPLIER_INVOICE"
        />
      }
    >
      <PurchaseInvoiceForm
        invoice={invoice}
        disabled={!isEdit}
        onSuccess={() => router.push(viewHref)}
      />
      <CreateDebitNoteDialog
        open={debitOpen}
        onOpenChange={setDebitOpen}
        purchaseInvoiceId={invoice.id}
      />
      <ApplyDebitsDialog
        invoice={invoice}
        currencyCode={currencyCode}
        open={applyDebitsOpen}
        onOpenChange={setApplyDebitsOpen}
      />
      <ComposeFromBillsDialog
        open={landedCostOpen}
        onOpenChange={setLandedCostOpen}
        purchaseInvoiceId={invoice.id}
      />
      <PurchaseInvoiceWriteOffDialog
        invoice={invoice}
        currencyCode={currencyCode}
        open={writeOffOpen}
        onOpenChange={setWriteOffOpen}
      />
    </DocumentRecordShell>
  );
}
