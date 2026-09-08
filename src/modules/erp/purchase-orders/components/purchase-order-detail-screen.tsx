"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { BillingStatusBadge } from "@/modules/erp/purchase-orders/components/purchase-order-billing-status-badge";
import { PurchaseOrderForm } from "@/modules/erp/purchase-orders/components/purchase-order-form";
import { PurchaseOrderStatusBadge } from "@/modules/erp/purchase-orders/components/purchase-order-status-badge";
import { ReceiptStatusBadge } from "@/modules/erp/purchase-orders/components/receipt-status-badge";
import { PurchaseOrderWorkflowButtons } from "@/modules/erp/purchase-orders/components/purchase-order-workflow-buttons";
import { purchaseOrderPermissions } from "@/modules/erp/purchase-orders/permissions";
import { usePurchaseOrder } from "@/modules/erp/purchase-orders/queries";
import { purchaseOrderDisplayNumber } from "@/modules/erp/purchase-orders/schemas";
import { EntityAttachmentsPanel } from "@/modules/users-management/attachments/components/entity-attachments-panel";
import { getErrorMessage } from "@/shared/api/errors";
import { useCrudPermissions } from "@/shared/auth/use-crud-permissions";
import { DataTableError } from "@/shared/components/data-table/states";
import {
  RecordPageHeader,
  type RecordPageMode,
} from "@/shared/components/layout/record-page-header";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";

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

  if (purchaseOrderQuery.isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (purchaseOrderQuery.isError || !purchaseOrder) {
    return (
      <div className="flex flex-col gap-3">
        <DataTableError
          message={
            purchaseOrderQuery.error
              ? getErrorMessage(purchaseOrderQuery.error)
              : "Purchase order not found"
          }
          onRetry={() => purchaseOrderQuery.refetch()}
        />
        <Button type="button" variant="outline" asChild>
          <Link href="/purchase-orders">Back to purchase orders</Link>
        </Button>
      </div>
    );
  }

  const number = purchaseOrderDisplayNumber(purchaseOrder);

  return (
    <div className="flex flex-col gap-5">
      <RecordPageHeader
        title={number ?? "Purchase order"}
        subtitle={number ? undefined : "Number not assigned yet"}
        listHref="/purchase-orders"
        viewHref={viewHref}
        editHref={canEditDraft ? `${viewHref}/edit` : undefined}
        canUpdate={canEditDraft}
        mode={mode}
        extraActions={
          isEdit ? null : (
            <>
              <PurchaseOrderStatusBadge status={purchaseOrder.status} />
              <ReceiptStatusBadge status={purchaseOrder.receipt_status} />
              <BillingStatusBadge status={purchaseOrder.billing_status} />
              <PurchaseOrderWorkflowButtons purchaseOrder={purchaseOrder} />
            </>
          )
        }
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {isEdit ? "Edit purchase order" : "Purchase order"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <PurchaseOrderForm
            purchaseOrder={purchaseOrder}
            disabled={!isEdit}
            onSuccess={() => router.push(viewHref)}
          />
        </CardContent>
      </Card>
      {isEdit ? null : (
        <EntityAttachmentsPanel entityType="PURCHASE_ORDER" entityId={purchaseOrder.id} />
      )}
    </div>
  );
}
