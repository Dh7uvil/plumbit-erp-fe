"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { CreateInvoiceFromSalesOrderDialog } from "@/modules/erp/sales-invoices/components/create-from-sales-order-dialog";
import { salesInvoicePermissions } from "@/modules/erp/sales-invoices/permissions";

import { useSalesOrderWorkflow } from "@/modules/erp/sales-orders/hooks/use-sales-order-workflow";
import { SalesOrderCoverageCard } from "@/modules/erp/sales-orders/components/sales-order-coverage-card";
import { SalesOrderTrackerCard } from "@/modules/erp/sales-orders/components/sales-order-tracker-card";
import { SalesOrderForm } from "@/modules/erp/sales-orders/components/sales-order-form";
import { salesOrderPermissions } from "@/modules/erp/sales-orders/permissions";
import { useSalesOrder } from "@/modules/erp/sales-orders/queries";
import {
  BILLING_STATUS_LABELS,
  BILLING_STATUS_VARIANTS,
  FULFILLMENT_STATUS_LABELS,
  FULFILLMENT_STATUS_VARIANTS,
  SALES_ORDER_STATUS_LABELS,
  SALES_ORDER_STATUS_VARIANTS,
  salesOrderDisplayNumber,
  type SalesOrder,
} from "@/modules/erp/sales-orders/schemas";
import { SALES_ORDER_ACTION_REGISTRY } from "@/modules/erp/sales-orders/workflow";
import { ActivityFeed } from "@/modules/users-management/activity/components/activity-feed";
import { EntityAttachmentsPanel } from "@/modules/users-management/attachments/components/entity-attachments-panel";
import { useCrudPermissions } from "@/shared/auth/use-crud-permissions";
import { DocumentRecordShell } from "@/shared/components/document/document-record-shell";
import { DocumentStatusBadge } from "@/shared/components/document/document-status-badge";
import { DocumentWorkflowButtons } from "@/shared/components/document/document-workflow-buttons";
import type { RecordPageMode } from "@/shared/components/layout/record-page-header";
import { Button } from "@/shared/components/ui/button";
import { formatDate, formatDateTime } from "@/shared/lib/format";
import { useCan } from "@/shared/providers/session-provider";

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
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const canCreateInvoice =
    (salesOrder.status === "CONFIRMED" || salesOrder.status === "CLOSED") &&
    can(salesInvoicePermissions.create);

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
            onAction={onAction}
          />
        </div>
      }
      banner={
        <div className="flex flex-col gap-1">
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
        </div>
      }
      formTitle={isEdit ? "Edit sales order" : "Sales order"}
      panels={
        <>
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
        salesOrderId={salesOrder.id}
        open={invoiceOpen}
        onOpenChange={setInvoiceOpen}
      />
    </DocumentRecordShell>
  );
}
