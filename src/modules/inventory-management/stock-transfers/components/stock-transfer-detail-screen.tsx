"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { StockTransferForm } from "@/modules/inventory-management/stock-transfers/components/stock-transfer-form";
import { StockTransferStatusBadge } from "@/modules/inventory-management/stock-transfers/components/stock-transfer-status-badge";
import { StockTransferWorkflowButtons } from "@/modules/inventory-management/stock-transfers/components/stock-transfer-workflow-buttons";
import { stockTransferPermissions } from "@/modules/inventory-management/stock-transfers/permissions";
import { useStockTransfer } from "@/modules/inventory-management/stock-transfers/queries";
import { stockTransferDisplayNumber } from "@/modules/inventory-management/stock-transfers/schemas";
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

export function StockTransferDetailScreen({
  transferId,
  mode,
}: {
  transferId: string;
  mode: RecordPageMode;
}) {
  const router = useRouter();
  const { canUpdate } = useCrudPermissions(stockTransferPermissions);
  const transferQuery = useStockTransfer(transferId);
  const transfer = transferQuery.data;
  const isDraft = transfer?.status === "DRAFT";
  const isEdit = mode === "edit";
  const viewHref = `/stock-transfers/${transferId}`;
  const canEditDraft = Boolean(isDraft && canUpdate);

  useEffect(() => {
    if (isEdit && transfer && transfer.status !== "DRAFT") {
      router.replace(viewHref);
    }
  }, [isEdit, router, transfer, viewHref]);

  if (transferQuery.isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (transferQuery.isError || !transfer) {
    return (
      <div className="flex flex-col gap-3">
        <DataTableError
          message={
            transferQuery.error ? getErrorMessage(transferQuery.error) : "Stock transfer not found"
          }
          onRetry={() => transferQuery.refetch()}
        />
        <Button type="button" variant="outline" asChild>
          <Link href="/stock-transfers">Back to transfers</Link>
        </Button>
      </div>
    );
  }

  const number = stockTransferDisplayNumber(transfer);

  return (
    <div className="flex flex-col gap-5">
      <RecordPageHeader
        title={number ?? "Stock transfer"}
        subtitle={number ? undefined : "Number not assigned yet"}
        listHref="/stock-transfers"
        viewHref={viewHref}
        editHref={canEditDraft ? `${viewHref}/edit` : undefined}
        canUpdate={canEditDraft}
        mode={mode}
        extraActions={
          isEdit ? null : (
            <>
              <StockTransferStatusBadge status={transfer.status} />
              <StockTransferWorkflowButtons transfer={transfer} />
            </>
          )
        }
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {isEdit ? "Edit stock transfer" : "Stock transfer"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <StockTransferForm
            transfer={transfer}
            disabled={!isEdit}
            onSuccess={() => router.push(viewHref)}
          />
        </CardContent>
      </Card>
    </div>
  );
}
