"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { PurchaseOrderForm } from "@/modules/erp/purchase-orders/components/purchase-order-form";
import { usePurchaseOrderWorkflow } from "@/modules/erp/purchase-orders/hooks/use-purchase-order-workflow";
import { purchaseOrderPermissions } from "@/modules/erp/purchase-orders/permissions";
import { usePurchaseOrder } from "@/modules/erp/purchase-orders/queries";
import {
  BILLING_STATUS_LABELS,
  BILLING_STATUS_VARIANTS,
  PURCHASE_ORDER_STATUS_LABELS,
  PURCHASE_ORDER_STATUS_VARIANTS,
  RECEIPT_STATUS_LABELS,
  RECEIPT_STATUS_VARIANTS,
  purchaseOrderDisplayNumber,
  type PurchaseOrder,
} from "@/modules/erp/purchase-orders/schemas";
import { PURCHASE_ORDER_ACTION_REGISTRY, type PurchaseOrderWorkflowAction } from "@/modules/erp/purchase-orders/workflow";
import { useCreateGoodsReceiptFromPurchaseOrder } from "@/modules/inventory-management/goods-receipts/mutations";
import {
  StockWriteAlert,
  isStockWriteAlertError,
} from "@/modules/erp/period-lock/components/stock-write-alert";
import { ActivityFeed } from "@/modules/users-management/activity/components/activity-feed";
import { EntityAttachmentsPanel } from "@/modules/users-management/attachments/components/entity-attachments-panel";
import { getErrorMessage } from "@/shared/api/errors";
import { useCrudPermissions } from "@/shared/auth/use-crud-permissions";
import { DocumentRecordShell } from "@/shared/components/document/document-record-shell";
import { DocumentStatusBadge } from "@/shared/components/document/document-status-badge";
import {
  DocumentWorkflowButtons,
  type DocumentWorkflowExtras,
} from "@/shared/components/document/document-workflow-buttons";
import type { RecordPageMode } from "@/shared/components/layout/record-page-header";

export function PurchaseOrderDetailScreen({
  purchaseOrderId,
  mode,
}: {
  purchaseOrderId: string;
  mode: RecordPageMode;
}) {
  const router = useRouter();
  const { canUpdate } = useCrudPermissions(purchaseOrderPermissions);
  const purchaseOrderQuery = usePurchaseOrder(purchaseOrderId);
  const purchaseOrder = purchaseOrderQuery.data;
  const isDraft = purchaseOrder?.status === "DRAFT";
  const isEdit = mode === "edit";
  const viewHref = `/purchase-orders/${purchaseOrderId}`;
  const canEditDraft = Boolean(isDraft && canUpdate);

  useEffect(() => {
    if (isEdit && purchaseOrder && purchaseOrder.status !== "DRAFT") {
      router.replace(viewHref);
    }
  }, [isEdit, purchaseOrder, router, viewHref]);

  if (purchaseOrderQuery.isLoading || purchaseOrderQuery.isError || !purchaseOrder) {
    return (
      <DocumentRecordShell
        isLoading={purchaseOrderQuery.isLoading}
        isError={purchaseOrderQuery.isError || !purchaseOrder}
        error={purchaseOrderQuery.error}
        notFoundMessage="Purchase order not found"
        onRetry={() => purchaseOrderQuery.refetch()}
        backHref="/purchase-orders"
        backLabel="Back to purchase orders"
        title="Purchase order"
        listHref="/purchase-orders"
        viewHref={viewHref}
        canUpdate={false}
        mode={mode}
        formTitle="Purchase order"
      >
        {null}
      </DocumentRecordShell>
    );
  }

  return (
    <PurchaseOrderDetailLoaded
      purchaseOrder={purchaseOrder}
      mode={mode}
      canEditDraft={canEditDraft}
      viewHref={viewHref}
    />
  );
}

function PurchaseOrderDetailLoaded({
  purchaseOrder,
  mode,
  canEditDraft,
  viewHref,
}: {
  purchaseOrder: PurchaseOrder;
  mode: RecordPageMode;
  canEditDraft: boolean;
  viewHref: string;
}) {
  const router = useRouter();
  const isEdit = mode === "edit";
  const number = purchaseOrderDisplayNumber(purchaseOrder);
  const onAction = usePurchaseOrderWorkflow(purchaseOrder);
  const createFromPo = useCreateGoodsReceiptFromPurchaseOrder();
  const [writeError, setWriteError] = useState<unknown>(null);
  const workflowActions =
    purchaseOrder.available_actions.includes("create_goods_receipt") ||
    purchaseOrder.status !== "ISSUED" ||
    purchaseOrder.receipt_status === "RECEIVED"
      ? purchaseOrder.available_actions
      : [...purchaseOrder.available_actions, "create_goods_receipt"];

  async function handleAction(action: PurchaseOrderWorkflowAction, extras: DocumentWorkflowExtras) {
    if (action === "create_goods_receipt") {
      setWriteError(null);
      try {
        const receipt = await createFromPo.mutateAsync({
          purchase_order_id: purchaseOrder.id,
        });
        toast.success("Goods receipt created");
        router.push(`/goods-receipts/${receipt.id}`);
      } catch (error) {
        if (isStockWriteAlertError(error)) {
          setWriteError(error);
          return;
        }
        toast.error(getErrorMessage(error));
      }
      return;
    }
    await onAction(action, extras);
  }

  return (
    <DocumentRecordShell
      isLoading={false}
      isError={false}
      notFoundMessage="Purchase order not found"
      onRetry={() => undefined}
      backHref="/purchase-orders"
      backLabel="Back to purchase orders"
      title={number ?? "Purchase order"}
      subtitle={number ? undefined : "Number not assigned yet"}
      listHref="/purchase-orders"
      viewHref={viewHref}
      editHref={canEditDraft ? `${viewHref}/edit` : undefined}
      canUpdate={canEditDraft}
      mode={mode}
      badges={
        <>
          <DocumentStatusBadge
            status={purchaseOrder.status}
            labels={PURCHASE_ORDER_STATUS_LABELS}
            variants={PURCHASE_ORDER_STATUS_VARIANTS}
          />
          <DocumentStatusBadge
            status={purchaseOrder.receipt_status}
            labels={RECEIPT_STATUS_LABELS}
            variants={RECEIPT_STATUS_VARIANTS}
          />
          <DocumentStatusBadge
            status={purchaseOrder.billing_status}
            labels={BILLING_STATUS_LABELS}
            variants={BILLING_STATUS_VARIANTS}
          />
        </>
      }
      workflow={
        <DocumentWorkflowButtons
          availableActions={workflowActions}
          registry={PURCHASE_ORDER_ACTION_REGISTRY}
          documentKind="purchase order"
          documentLabel={number ?? "purchase order"}
          extra={<StockWriteAlert error={writeError} />}
          onAction={handleAction}
        />
      }
      banner={
        purchaseOrder.source_sales_order_id ? (
          <p className="text-muted-foreground text-sm">
            Raised for{" "}
            <Link
              href={`/sales-orders/${purchaseOrder.source_sales_order_id}`}
              className="text-foreground underline-offset-4 hover:underline"
            >
              sales order
            </Link>
            .
          </p>
        ) : null
      }
      formTitle={isEdit ? "Edit purchase order" : "Purchase order"}
      attachments={
        <EntityAttachmentsPanel
          entityType="PURCHASE_ORDER"
          entityId={purchaseOrder.id}
          parentPosted={purchaseOrder.is_posted}
        />
      }
      activity={
        <ActivityFeed
          entityType="purchase_order"
          entityId={purchaseOrder.id}
          revision={purchaseOrder.version}
        />
      }
    >
      <PurchaseOrderForm
        purchaseOrder={purchaseOrder}
        disabled={!isEdit}
        onSuccess={() => router.push(viewHref)}
      />
    </DocumentRecordShell>
  );
}
