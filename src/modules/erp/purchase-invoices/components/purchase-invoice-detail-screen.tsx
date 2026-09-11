"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useAllCurrencies } from "@/modules/erp/currencies/queries";
import { CreateDebitNoteDialog } from "@/modules/erp/debit-notes/components/create-from-source-dialog";
import { InvoiceDebitNotesCard } from "@/modules/erp/debit-notes/components/invoice-debit-notes-card";
import { debitNotePermissions } from "@/modules/erp/debit-notes/permissions";
import {
  StockWriteAlert,
  isStockWriteAlertError,
} from "@/modules/erp/period-lock/components/stock-write-alert";
import { landedCostPermissions } from "@/modules/erp/landed-costs/permissions";
import { ComposeFromBillsDialog } from "@/modules/erp/landed-costs/components/compose-from-bills-dialog";
import { ApplyDebitsDialog } from "@/modules/erp/purchase-invoices/components/apply-debits-dialog";
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
import { ActivityFeed } from "@/modules/users-management/activity/components/activity-feed";
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
import type { RecordPageMode } from "@/shared/components/layout/record-page-header";
import { Button } from "@/shared/components/ui/button";
import { formatDate } from "@/shared/lib/format";
import { useCan } from "@/shared/providers/session-provider";

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
        backHref="/purchase-invoices"
        backLabel="Back to purchase invoices"
        title="Purchase invoice"
        listHref="/purchase-invoices"
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
  const can = useCan();
  const isEdit = mode === "edit";
  const number = purchaseInvoiceDisplayNumber(invoice);
  const onAction = usePurchaseInvoiceWorkflow(invoice);
  const [writeError, setWriteError] = useState<unknown>(null);
  const [debitOpen, setDebitOpen] = useState(false);
  const [applyDebitsOpen, setApplyDebitsOpen] = useState(false);
  const [landedCostOpen, setLandedCostOpen] = useState(false);
  const currenciesQuery = useAllCurrencies();
  const currencyCode =
    currenciesQuery.data?.find((currency) => currency.id === invoice.currency_id)?.code ?? "";
  const canCreateDebit = invoice.status === "POSTED" && can(debitNotePermissions.create);
  const canCreateLandedCost =
    invoice.status === "POSTED" &&
    can(landedCostPermissions.create) &&
    invoice.lines.some((line) => line.line_type === "EXPENSE");

  return (
    <DocumentRecordShell
      isLoading={false}
      isError={false}
      notFoundMessage="Purchase invoice not found"
      onRetry={() => undefined}
      backHref="/purchase-invoices"
      backLabel="Back to purchase invoices"
      title={number ?? "Purchase invoice"}
      subtitle={number ? undefined : "Number not assigned yet"}
      listHref="/purchase-invoices"
      viewHref={viewHref}
      printHref={printHref("purchase-invoices", invoice.id)}
      editHref={canEditDraft ? `${viewHref}/edit` : undefined}
      canUpdate={canEditDraft}
      mode={mode}
      badges={
        <>
          <DocumentStatusBadge
            status={invoice.status}
            labels={INVOICE_DOCUMENT_STATUS_LABELS}
            variants={INVOICE_DOCUMENT_STATUS_VARIANTS}
          />
          <DocumentStatusBadge
            status={invoice.payment_status}
            labels={PAYMENT_STATUS_LABELS}
            variants={PAYMENT_STATUS_VARIANTS}
          />
          {invoice.is_overdue ? (
            <DocumentStatusBadge
              status="OVERDUE"
              labels={{ OVERDUE: "Overdue" }}
              variants={{ OVERDUE: "destructive" }}
            />
          ) : null}
          {invoice.is_fully_debited ? (
            <DocumentStatusBadge
              status="DEBITED"
              labels={{ DEBITED: "Debited" }}
              variants={{ DEBITED: "secondary" }}
            />
          ) : invoice.is_partially_debited ? (
            <DocumentStatusBadge
              status="PARTIALLY_DEBITED"
              labels={{ PARTIALLY_DEBITED: "Partially debited" }}
              variants={{ PARTIALLY_DEBITED: "warning" }}
            />
          ) : null}
        </>
      }
      workflow={
        <div className="flex flex-col items-end gap-2">
          {canCreateDebit ? (
            <Button type="button" size="sm" variant="outline" onClick={() => setDebitOpen(true)}>
              Create debit note
            </Button>
          ) : null}
          {canCreateLandedCost ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setLandedCostOpen(true)}
            >
              Create landed cost
            </Button>
          ) : null}
          <DocumentWorkflowButtons
            availableActions={invoice.available_actions}
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
                  `/supplier-payments/new?supplier_id=${invoice.supplier_id}&invoice_id=${invoice.id}`,
                );
                return;
              }
              if (action === "apply_debits") {
                setApplyDebitsOpen(true);
                return;
              }
              await onAction(action, extras);
            }}
          />
        </div>
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
          <DocumentSettlementCard
            amountPaid={invoice.amount_paid}
            amountAdjusted={invoice.amount_debited}
            adjustedLabel="Amount debited"
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
      activity={
        <ActivityFeed
          entityType="purchase_invoice"
          entityId={invoice.id}
          revision={invoice.version}
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
    </DocumentRecordShell>
  );
}
