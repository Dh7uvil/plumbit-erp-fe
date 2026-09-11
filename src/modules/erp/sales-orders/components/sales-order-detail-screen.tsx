"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { CreditLimitBanner } from "@/modules/erp/credit-control/components/credit-limit-banner";
import { CreateInvoiceFromSalesOrderDialog } from "@/modules/erp/sales-invoices/components/create-from-sales-order-dialog";
import { salesInvoicePermissions } from "@/modules/erp/sales-invoices/permissions";
import { CreateProformaInvoiceFromSalesOrderDialog } from "@/modules/erp/sales-orders/components/create-proforma-invoice-dialog";
import { SalesOrderCoverageCard } from "@/modules/erp/sales-orders/components/sales-order-coverage-card";
import { SalesOrderForm } from "@/modules/erp/sales-orders/components/sales-order-form";
import { SalesOrderTrackerCard } from "@/modules/erp/sales-orders/components/sales-order-tracker-card";
import { useSalesOrderWorkflow } from "@/modules/erp/sales-orders/hooks/use-sales-order-workflow";
import { useConfirmSalesOrder } from "@/modules/erp/sales-orders/mutations";
import { salesOrderPermissions } from "@/modules/erp/sales-orders/permissions";
import { useSalesOrder } from "@/modules/erp/sales-orders/queries";
import {
  BILLING_STATUS_LABELS,
  BILLING_STATUS_VARIANTS,
  FULFILLMENT_STATUS_LABELS,
  FULFILLMENT_STATUS_VARIANTS,
  SALES_ORDER_STATUS_LABELS,
  SALES_ORDER_STATUS_VARIANTS,
  TAX_TREATMENT_LABELS,
  salesOrderDisplayNumber,
  type SalesOrder,
} from "@/modules/erp/sales-orders/schemas";
import {
  SALES_ORDER_ACTION_REGISTRY,
  type SalesOrderWorkflowAction,
} from "@/modules/erp/sales-orders/workflow";
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
import { QuantityProgressStrip } from "@/shared/components/document/quantity-progress-strip";
import { RelatedDocumentsCard } from "@/shared/components/document/related-documents-card";
import type { RecordPageMode } from "@/shared/components/layout/record-page-header";
import { Button } from "@/shared/components/ui/button";
import { isApiError } from "@/shared/api/errors";
import { formatDate, formatDateTime } from "@/shared/lib/format";
import { useCan } from "@/shared/providers/session-provider";
import { toast } from "sonner";

export function SalesOrderDetailScreen({
  salesOrderId,
  mode,
}: {
  salesOrderId: string;
  mode: RecordPageMode;
}) {
  const router = useRouter();
  const { canUpdate } = useCrudPermissions(salesOrderPermissions);
  const salesOrderQuery = useSalesOrder(salesOrderId);
  const salesOrder = salesOrderQuery.data;
  const isDraft = salesOrder?.status === "DRAFT";
  const isEdit = mode === "edit";
  const viewHref = `/sales-orders/${salesOrderId}`;
  const canEditDraft = Boolean(isDraft && canUpdate);

  useEffect(() => {
    if (isEdit && salesOrder && salesOrder.status !== "DRAFT") {
      router.replace(viewHref);
    }
  }, [isEdit, salesOrder, router, viewHref]);

  if (salesOrderQuery.isLoading || salesOrderQuery.isError || !salesOrder) {
    return (
      <DocumentRecordShell
        isLoading={salesOrderQuery.isLoading}
        isError={salesOrderQuery.isError || !salesOrder}
        error={salesOrderQuery.error}
        notFoundMessage="Sales order not found"
        onRetry={() => salesOrderQuery.refetch()}
        backHref="/sales-orders"
        backLabel="Back to sales orders"
        title="Sales order"
        listHref="/sales-orders"
        viewHref={viewHref}
        canUpdate={false}
        mode={mode}
        formTitle="Sales order"
      >
        {null}
      </DocumentRecordShell>
    );
  }

  return (
    <SalesOrderDetailLoaded
      salesOrder={salesOrder}
      mode={mode}
      canEditDraft={canEditDraft}
      viewHref={viewHref}
    />
  );
}

function SalesOrderDetailLoaded({
  salesOrder,
  mode,
  canEditDraft,
  viewHref,
}: {
  salesOrder: SalesOrder;
  mode: RecordPageMode;
  canEditDraft: boolean;
  viewHref: string;
}) {
  const router = useRouter();
  const can = useCan();
  const isEdit = mode === "edit";
  const number = salesOrderDisplayNumber(salesOrder);
  const onAction = useSalesOrderWorkflow(salesOrder);
  const confirmSalesOrder = useConfirmSalesOrder();
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [proformaOpen, setProformaOpen] = useState(false);
  const [creditBlockError, setCreditBlockError] = useState<unknown>(null);
  const canCreateInvoice =
    (salesOrder.status === "CONFIRMED" || salesOrder.status === "CLOSED") &&
    can(salesInvoicePermissions.create);

  async function handleAction(action: SalesOrderWorkflowAction, extras: DocumentWorkflowExtras) {
    if (action === "create_proforma") {
      setProformaOpen(true);
      return;
    }
    await onAction(action, extras);
  }

  return (
    <DocumentRecordShell
      isLoading={false}
      isError={false}
      notFoundMessage="Sales order not found"
      onRetry={() => undefined}
      backHref="/sales-orders"
      backLabel="Back to sales orders"
      title={number ?? "Sales order"}
      subtitle={number ? undefined : "Number not assigned yet"}
      listHref="/sales-orders"
      viewHref={viewHref}
      editHref={canEditDraft ? `${viewHref}/edit` : undefined}
      canUpdate={canEditDraft}
      mode={mode}
      badges={
        <>
          <DocumentStatusBadge
            status={salesOrder.status}
            labels={SALES_ORDER_STATUS_LABELS}
            variants={SALES_ORDER_STATUS_VARIANTS}
          />
          <DocumentStatusBadge
            status={salesOrder.fulfillment_status}
            labels={FULFILLMENT_STATUS_LABELS}
            variants={FULFILLMENT_STATUS_VARIANTS}
          />
          <DocumentStatusBadge
            status={salesOrder.billing_status}
            labels={BILLING_STATUS_LABELS}
            variants={BILLING_STATUS_VARIANTS}
          />
        </>
      }
      workflow={
        <div className="flex flex-col items-end gap-2">
          {canCreateInvoice ? (
            <Button type="button" size="sm" variant="outline" onClick={() => setInvoiceOpen(true)}>
              Create invoice
            </Button>
          ) : null}
          <DocumentWorkflowButtons
            availableActions={salesOrder.available_actions}
            registry={SALES_ORDER_ACTION_REGISTRY}
            documentKind="sales order"
            documentLabel={number ?? "sales order"}
            onError={(error) => {
              if (isApiError(error) && error.code === "CREDIT_LIMIT_EXCEEDED") {
                setCreditBlockError(error);
                return true;
              }
              return false;
            }}
            onAction={async (action, extras) => {
              setCreditBlockError(null);
              await handleAction(action, extras);
            }}
          />
        </div>
      }
      banner={
        <div className="flex flex-col gap-1">
          <AppliedCommercialTerms
            currencyId={salesOrder.currency_id}
            exchangeRate={salesOrder.exchange_rate}
            taxTreatmentLabel={TAX_TREATMENT_LABELS[salesOrder.tax_treatment]}
            paymentTermsId={salesOrder.payment_terms_id}
          />
          {salesOrder.quantity_progress ? (
            <QuantityProgressStrip
              progress={salesOrder.quantity_progress}
              fulfilledLabel="Delivered"
              remainingFulfillLabel="Remaining to deliver"
            />
          ) : null}
          {salesOrder.customer_po_number ? (
            <p className="text-sm">
              Customer PO {salesOrder.customer_po_number}
              {salesOrder.customer_po_date ? ` dated ${formatDate(salesOrder.customer_po_date)}` : ""}
              {salesOrder.acknowledged_at
                ? `. Acknowledged on ${formatDateTime(salesOrder.acknowledged_at)}`
                : ""}
              .
            </p>
          ) : salesOrder.acknowledged_at ? (
            <p className="text-muted-foreground text-sm">
              Acknowledged on {formatDateTime(salesOrder.acknowledged_at)}.
            </p>
          ) : null}
          {salesOrder.source_quotation_id || salesOrder.source_proforma_invoice_id ? (
            <p className="text-muted-foreground text-sm">
              Converted from{" "}
              {salesOrder.source_proforma_invoice_id ? (
                <Link
                  href={`/proforma-invoices/${salesOrder.source_proforma_invoice_id}`}
                  className="text-foreground underline-offset-4 hover:underline"
                >
                  proforma invoice
                </Link>
              ) : null}
              {salesOrder.source_quotation_id && salesOrder.source_proforma_invoice_id
                ? " · "
                : null}
              {salesOrder.source_quotation_id ? (
                <Link
                  href={`/quotations/${salesOrder.source_quotation_id}`}
                  className="text-foreground underline-offset-4 hover:underline"
                >
                  quotation
                </Link>
              ) : null}
              .
            </p>
          ) : null}
          <CreditLimitBanner
            warnings={salesOrder.warnings}
            blockError={creditBlockError}
            overridePending={confirmSalesOrder.isPending}
            onOverride={async (reason) => {
              const confirmed = await confirmSalesOrder.mutateAsync({
                id: salesOrder.id,
                version: salesOrder.version,
                creditOverride: reason,
              });
              const shortfalls = confirmed.reservation_shortfalls.filter(
                (row) => Number(row.shortfall) > 0,
              );
              if (shortfalls.length > 0) {
                toast.warning(
                  `Sales order confirmed with ${shortfalls.length} stock shortfall${shortfalls.length === 1 ? "" : "s"}.`,
                );
              } else {
                toast.success("Sales order confirmed");
              }
              setCreditBlockError(null);
            }}
          />
        </div>
      }
      formTitle={isEdit ? "Edit sales order" : "Sales order"}
      panels={
        <>
          <RelatedDocumentsCard documents={salesOrder.related_documents} />
          <SalesOrderCoverageCard salesOrder={salesOrder} />
          <SalesOrderTrackerCard salesOrderId={salesOrder.id} />
        </>
      }
      attachments={
        <EntityAttachmentsPanel
          entityType="SALES_ORDER"
          entityId={salesOrder.id}
          parentPosted={salesOrder.is_posted}
          defaultCategory="CUSTOMER_PO"
        />
      }
      activity={
        <ActivityFeed
          entityType="sales_order"
          entityId={salesOrder.id}
          revision={salesOrder.version}
        />
      }
    >
      <SalesOrderForm
        salesOrder={salesOrder}
        disabled={!isEdit}
        onSuccess={() => router.push(viewHref)}
      />
      <CreateInvoiceFromSalesOrderDialog
        salesOrder={salesOrder}
        open={invoiceOpen}
        onOpenChange={setInvoiceOpen}
      />
      <CreateProformaInvoiceFromSalesOrderDialog
        salesOrder={salesOrder}
        open={proformaOpen}
        onOpenChange={setProformaOpen}
      />
    </DocumentRecordShell>
  );
}
