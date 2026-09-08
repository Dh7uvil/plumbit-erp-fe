"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { StockAdjustmentForm } from "@/modules/inventory-management/stock-adjustments/components/stock-adjustment-form";
import { StockAdjustmentStatusBadge } from "@/modules/inventory-management/stock-adjustments/components/stock-adjustment-status-badge";
import { StockAdjustmentWorkflowButtons } from "@/modules/inventory-management/stock-adjustments/components/stock-adjustment-workflow-buttons";
import { stockAdjustmentPermissions } from "@/modules/inventory-management/stock-adjustments/permissions";
import { useStockAdjustment } from "@/modules/inventory-management/stock-adjustments/queries";
import { stockAdjustmentDisplayNumber } from "@/modules/inventory-management/stock-adjustments/schemas";
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

export function StockAdjustmentDetailScreen({
  adjustmentId,
  mode,
}: {
  adjustmentId: string;
  mode: RecordPageMode;
}) {
  const router = useRouter();
  const { canUpdate } = useCrudPermissions(stockAdjustmentPermissions);
  const adjustmentQuery = useStockAdjustment(adjustmentId);
  const adjustment = adjustmentQuery.data;
  const isDraft = adjustment?.status === "DRAFT";
  const isEdit = mode === "edit";
  const viewHref = `/stock-adjustments/${adjustmentId}`;
  const canEditDraft = Boolean(isDraft && canUpdate);

  useEffect(() => {
    if (isEdit && adjustment && adjustment.status !== "DRAFT") {
      router.replace(viewHref);
    }
  }, [adjustment, isEdit, router, viewHref]);

  if (adjustmentQuery.isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (adjustmentQuery.isError || !adjustment) {
    return (
      <div className="flex flex-col gap-3">
        <DataTableError
          message={
            adjustmentQuery.error
              ? getErrorMessage(adjustmentQuery.error)
              : "Stock adjustment not found"
          }
          onRetry={() => adjustmentQuery.refetch()}
        />
        <Button type="button" variant="outline" asChild>
          <Link href="/stock-adjustments">Back to adjustments</Link>
        </Button>
      </div>
    );
  }

  const number = stockAdjustmentDisplayNumber(adjustment);

  return (
    <div className="flex flex-col gap-5">
      <RecordPageHeader
        title={number ?? "Stock adjustment"}
        subtitle={number ? undefined : "Number not assigned yet"}
        listHref="/stock-adjustments"
        viewHref={viewHref}
        editHref={canEditDraft ? `${viewHref}/edit` : undefined}
        canUpdate={canEditDraft}
        mode={mode}
        extraActions={
          isEdit ? null : (
            <>
              <StockAdjustmentStatusBadge status={adjustment.status} />
              <StockAdjustmentWorkflowButtons adjustment={adjustment} />
            </>
          )
        }
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {isEdit ? "Edit stock adjustment" : "Stock adjustment"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <StockAdjustmentForm
            adjustment={adjustment}
            disabled={!isEdit}
            onSuccess={() => router.push(viewHref)}
          />
        </CardContent>
      </Card>
    </div>
  );
}
