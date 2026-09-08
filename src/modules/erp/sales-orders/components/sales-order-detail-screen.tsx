"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { FulfillmentStatusBadge } from "@/modules/erp/sales-orders/components/fulfillment-status-badge";
import { BillingStatusBadge } from "@/modules/erp/sales-orders/components/sales-order-billing-status-badge";
import { SalesOrderForm } from "@/modules/erp/sales-orders/components/sales-order-form";
import { SalesOrderStatusBadge } from "@/modules/erp/sales-orders/components/sales-order-status-badge";
import { SalesOrderWorkflowButtons } from "@/modules/erp/sales-orders/components/sales-order-workflow-buttons";
import { salesOrderPermissions } from "@/modules/erp/sales-orders/permissions";
import { useSalesOrder } from "@/modules/erp/sales-orders/queries";
import { salesOrderDisplayNumber } from "@/modules/erp/sales-orders/schemas";
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

  if (salesOrderQuery.isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (salesOrderQuery.isError || !salesOrder) {
    return (
      <div className="flex flex-col gap-3">
        <DataTableError
          message={
            salesOrderQuery.error ? getErrorMessage(salesOrderQuery.error) : "Sales order not found"
          }
          onRetry={() => salesOrderQuery.refetch()}
        />
        <Button type="button" variant="outline" asChild>
          <Link href="/sales-orders">Back to sales orders</Link>
        </Button>
      </div>
    );
  }

  const number = salesOrderDisplayNumber(salesOrder);

  return (
    <div className="flex flex-col gap-5">
      <RecordPageHeader
        title={number ?? "Sales order"}
        subtitle={number ? undefined : "Number not assigned yet"}
        listHref="/sales-orders"
        viewHref={viewHref}
        editHref={canEditDraft ? `${viewHref}/edit` : undefined}
        canUpdate={canEditDraft}
        mode={mode}
        extraActions={
          isEdit ? null : (
            <>
              <SalesOrderStatusBadge status={salesOrder.status} />
              <FulfillmentStatusBadge status={salesOrder.fulfillment_status} />
              <BillingStatusBadge status={salesOrder.billing_status} />
              <SalesOrderWorkflowButtons salesOrder={salesOrder} />
            </>
          )
        }
      />
      {salesOrder.source_quotation_id ? (
        <p className="text-muted-foreground text-sm">
          Converted from{" "}
          <Link
            href={`/quotations/${salesOrder.source_quotation_id}`}
            className="text-foreground underline-offset-4 hover:underline"
          >
            quotation
          </Link>
          .
        </p>
      ) : null}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{isEdit ? "Edit sales order" : "Sales order"}</CardTitle>
        </CardHeader>
        <CardContent>
          <SalesOrderForm
            salesOrder={salesOrder}
            disabled={!isEdit}
            onSuccess={() => router.push(viewHref)}
          />
        </CardContent>
      </Card>
      {isEdit ? null : <EntityAttachmentsPanel entityType="SALES_ORDER" entityId={salesOrder.id} />}
    </div>
  );
}
