"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useAllCurrencies } from "@/modules/erp/currencies/queries";
import {
  StockWriteAlert,
  isStockWriteAlertError,
} from "@/modules/erp/period-lock/components/stock-write-alert";
import { CreditLimitBanner } from "@/modules/erp/credit-control/components/credit-limit-banner";
import { CreateCreditNoteDialog } from "@/modules/erp/credit-notes/components/create-from-source-dialog";
import { CreateDeliveryNoteFromSalesInvoiceDialog } from "@/modules/inventory-management/delivery-notes/components/create-from-sales-invoice-dialog";
import { InvoiceCreditNotesCard } from "@/modules/erp/credit-notes/components/invoice-credit-notes-card";
import { useSendPaymentReminder } from "@/modules/erp/accounting/dunning-rules/mutations";
import { ApplyCreditsDialog } from "@/modules/erp/sales-invoices/components/apply-credits-dialog";
import { PaymentRemindersCard } from "@/modules/erp/sales-invoices/components/payment-reminders-card";
import { SalesInvoiceWriteOffDialog } from "@/modules/erp/sales-invoices/components/write-off-dialog";
import { SalesInvoiceForm } from "@/modules/erp/sales-invoices/components/sales-invoice-form";
import { SalesInvoiceMarginCard } from "@/modules/erp/sales-invoices/components/sales-invoice-margin-card";
import { useSalesInvoiceWorkflow } from "@/modules/erp/sales-invoices/hooks/use-sales-invoice-workflow";
import { usePostSalesInvoice } from "@/modules/erp/sales-invoices/mutations";
import { salesInvoicePermissions } from "@/modules/erp/sales-invoices/permissions";
import { useSalesInvoice } from "@/modules/erp/sales-invoices/queries";
import {
  INVOICE_DOCUMENT_STATUS_LABELS,
  INVOICE_DOCUMENT_STATUS_VARIANTS,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_VARIANTS,
  TAX_TREATMENT_LABELS,
  salesInvoiceDisplayNumber,
  type SalesInvoice,
} from "@/modules/erp/sales-invoices/schemas";
import { SALES_INVOICE_ACTION_REGISTRY } from "@/modules/erp/sales-invoices/workflow";
import { EntityAttachmentsPanel } from "@/modules/users-management/attachments/components/entity-attachments-panel";
import { useCrudPermissions } from "@/shared/auth/use-crud-permissions";
import { AppliedCommercialTerms } from "@/shared/components/document/applied-commercial-terms";
import { DocumentLedgerCard } from "@/shared/components/document/document-ledger-card";
import { DocumentRecordShell } from "@/shared/components/document/document-record-shell";
import { printHref } from "@/shared/lib/print";
import { DocumentSettlementCard } from "@/shared/components/document/document-settlement-card";
import { DocumentStatusBadge } from "@/shared/components/document/document-status-badge";
import { DocumentWorkflowButtons } from "@/shared/components/document/document-workflow-buttons";
import { RelatedDocumentsCard } from "@/shared/components/document/related-documents-card";
import type { RecordPageMode } from "@/shared/components/layout/record-page-header";
import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import { isApiError } from "@/shared/api/errors";
import { useBaseCurrency } from "@/shared/hooks/use-base-currency";
import { formatDate, proportionDecimal } from "@/shared/lib/format";
import { toast } from "sonner";

export function SalesInvoiceDetailScreen({
  invoiceId,
  mode,
}: {
  invoiceId: string;
  mode: RecordPageMode;
}) {
  const router = useRouter();
  const { canUpdate } = useCrudPermissions(salesInvoicePermissions);
  const invoiceQuery = useSalesInvoice(invoiceId);
  const invoice = invoiceQuery.data;
  const isDraft = invoice?.status === "DRAFT";
  const isEdit = mode === "edit";
  const viewHref = `/sales-invoices/${invoiceId}`;
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
        notFoundMessage="Sales invoice not found"
        onRetry={() => invoiceQuery.refetch()}
        backHref="/sales-invoices"
        backLabel="Back to sales invoices"
        title="Sales invoice"
        listHref="/sales-invoices"
        viewHref={viewHref}
        canUpdate={false}
        mode={mode}
        formTitle="Sales invoice"
      >
        {null}
      </DocumentRecordShell>
    );
  }

  return (
    <SalesInvoiceDetailLoaded
      invoice={invoice}
      mode={mode}
      canEditDraft={canEditDraft}
      viewHref={viewHref}
    />
  );
}

function SalesInvoiceDetailLoaded({
  invoice,
  mode,
  canEditDraft,
  viewHref,
}: {
  invoice: SalesInvoice;
  mode: RecordPageMode;
  canEditDraft: boolean;
  viewHref: string;
}) {
  const router = useRouter();
  const isEdit = mode === "edit";
  const number = salesInvoiceDisplayNumber(invoice);
  const onAction = useSalesInvoiceWorkflow(invoice);
  const postInvoice = usePostSalesInvoice();
  const sendReminder = useSendPaymentReminder();
  const [writeError, setWriteError] = useState<unknown>(null);
  const [creditBlockError, setCreditBlockError] = useState<unknown>(null);
  const [creditOpen, setCreditOpen] = useState(false);
  const [deliveryOpen, setDeliveryOpen] = useState(false);
  const [applyCreditsOpen, setApplyCreditsOpen] = useState(false);
  const [writeOffOpen, setWriteOffOpen] = useState(false);
  const currenciesQuery = useAllCurrencies();
  const { baseCurrencyCode, baseCurrencyId } = useBaseCurrency();
  const currencyCode =
    currenciesQuery.data?.find((currency) => currency.id === invoice.currency_id)?.code ?? "";
  const baseBalanceDue =
    baseCurrencyId && invoice.currency_id !== baseCurrencyId
      ? proportionDecimal(invoice.balance_due, invoice.grand_total, invoice.base_amount)
      : null;
  const missingExportEvidence =
    invoice.is_export && invoice.status === "POSTED" && !invoice.export_evidence_ok;
  const workflowActions = invoice.available_actions;

  return (
    <DocumentRecordShell
      isLoading={false}
      isError={false}
      notFoundMessage="Sales invoice not found"
      onRetry={() => undefined}
      backHref="/sales-invoices"
      backLabel="Back to sales invoices"
      title={number ?? "Sales invoice"}
      subtitle={number ? undefined : "Number not assigned yet"}
      listHref="/sales-invoices"
      viewHref={viewHref}
      printHref={printHref("sales-invoices", invoice.id)}
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
          {invoice.is_fully_credited ? (
            <DocumentStatusBadge
              kind="Credit"
              status="CREDITED"
              labels={{ CREDITED: "Credited" }}
              variants={{ CREDITED: "secondary" }}
            />
          ) : invoice.is_partially_credited ? (
            <DocumentStatusBadge
              kind="Credit"
              status="PARTIALLY_CREDITED"
              labels={{ PARTIALLY_CREDITED: "Partially credited" }}
              variants={{ PARTIALLY_CREDITED: "warning" }}
            />
          ) : null}
        </>
      }
      workflow={
        <DocumentWorkflowButtons
          availableActions={workflowActions}
          registry={SALES_INVOICE_ACTION_REGISTRY}
          documentKind="sales invoice"
          documentLabel={number ?? "sales invoice"}
          extra={<StockWriteAlert error={writeError} />}
          onError={(error) => {
            if (isStockWriteAlertError(error)) {
              setWriteError(error);
              return true;
            }
            if (isApiError(error) && error.code === "CREDIT_LIMIT_EXCEEDED") {
              setCreditBlockError(error);
              return true;
            }
            return false;
          }}
          onAction={async (action, extras) => {
            setWriteError(null);
            setCreditBlockError(null);
            if (action === "record_payment") {
              router.push(
                `/customer-payments/new?customer_id=${invoice.customer_id}&invoice_id=${invoice.id}`,
              );
              return;
            }
            if (action === "apply_credits") {
              setApplyCreditsOpen(true);
              return;
            }
            if (action === "create_credit_note") {
              setCreditOpen(true);
              return;
            }
            if (action === "create_delivery_note") {
              setDeliveryOpen(true);
              return;
            }
            if (action === "write_off") {
              setWriteOffOpen(true);
              return;
            }
            if (action === "send_reminder") {
              const result = await sendReminder.mutateAsync({ invoiceId: invoice.id });
              toast.success(`Reminder queued to ${result.recipient_email}`);
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
            baseAmount={invoice.base_amount}
          />
          {missingExportEvidence ? (
            <Alert>
              <AlertDescription>
                This zero-rated export has no BL or customs evidence on its delivery notes. Posting
                is allowed; attach evidence to clear the exception list.
              </AlertDescription>
            </Alert>
          ) : null}
          <CreditLimitBanner
            warnings={invoice.warnings}
            blockError={creditBlockError}
            overridePending={postInvoice.isPending}
            onOverride={async (reason) => {
              await postInvoice.mutateAsync({
                id: invoice.id,
                version: invoice.version,
                creditOverride: reason,
              });
              toast.success("Sales invoice posted");
              setCreditBlockError(null);
            }}
          />
          {invoice.sales_order_id ||
          invoice.source_quotation_id ||
          invoice.source_proforma_invoice_id ? (
            <p className="text-muted-foreground text-sm">
              Invoiced from{" "}
              {invoice.sales_order_id ? (
                <Link
                  href={`/sales-orders/${invoice.sales_order_id}`}
                  className="text-foreground underline-offset-4 hover:underline"
                >
                  sales order
                </Link>
              ) : null}
              {invoice.sales_order_id &&
              (invoice.source_proforma_invoice_id || invoice.source_quotation_id)
                ? " · "
                : null}
              {invoice.source_proforma_invoice_id ? (
                <Link
                  href={`/proforma-invoices/${invoice.source_proforma_invoice_id}`}
                  className="text-foreground underline-offset-4 hover:underline"
                >
                  proforma invoice
                </Link>
              ) : null}
              {invoice.source_proforma_invoice_id && invoice.source_quotation_id ? " · " : null}
              {invoice.source_quotation_id ? (
                <Link
                  href={`/quotations/${invoice.source_quotation_id}`}
                  className="text-foreground underline-offset-4 hover:underline"
                >
                  quotation
                </Link>
              ) : null}
              {invoice.due_date ? ` · Due ${formatDate(invoice.due_date)}` : ""}.
            </p>
          ) : invoice.due_date ? (
            <p className="text-muted-foreground text-sm">Due {formatDate(invoice.due_date)}.</p>
          ) : null}
        </div>
      }
      formTitle={isEdit ? "Edit sales invoice" : "Sales invoice"}
      panels={
        <>
          <DocumentSettlementCard
            amountPaid={invoice.amount_paid}
            amountAdjusted={invoice.amount_credited}
            adjustedLabel="Amount credited"
            amountWrittenOff={invoice.amount_written_off}
            balanceDue={invoice.balance_due}
            currencyCode={currencyCode}
            baseBalanceDue={baseBalanceDue}
            baseCurrencyCode={baseCurrencyCode}
          />
          <RelatedDocumentsCard documents={invoice.related_documents} />
          <SalesInvoiceMarginCard invoice={invoice} />
          <DocumentLedgerCard
            journalEntryId={invoice.journal_entry_id}
            reversalJournalEntryId={invoice.reversal_journal_entry_id}
          />
          <InvoiceCreditNotesCard salesInvoiceId={invoice.id} />
          <PaymentRemindersCard salesInvoiceId={invoice.id} />
        </>
      }
      attachments={
        <EntityAttachmentsPanel
          entityType="SALES_INVOICE"
          entityId={invoice.id}
          parentPosted={invoice.is_posted}
        />
      }
    >
      <SalesInvoiceForm
        invoice={invoice}
        disabled={!isEdit}
        onSuccess={() => router.push(viewHref)}
      />
      <CreateCreditNoteDialog
        open={creditOpen}
        onOpenChange={setCreditOpen}
        salesInvoiceId={invoice.id}
      />
      <CreateDeliveryNoteFromSalesInvoiceDialog
        open={deliveryOpen}
        onOpenChange={setDeliveryOpen}
        salesInvoiceId={invoice.id}
      />
      <ApplyCreditsDialog
        invoice={invoice}
        currencyCode={currencyCode}
        open={applyCreditsOpen}
        onOpenChange={setApplyCreditsOpen}
      />
      <SalesInvoiceWriteOffDialog
        invoice={invoice}
        currencyCode={currencyCode}
        open={writeOffOpen}
        onOpenChange={setWriteOffOpen}
      />
    </DocumentRecordShell>
  );
}
