"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  StockWriteAlert,
  isStockWriteAlertError,
} from "@/modules/erp/period-lock/components/stock-write-alert";
import { StockTransferForm } from "@/modules/inventory-management/stock-transfers/components/stock-transfer-form";
import { useStockTransferWorkflow } from "@/modules/inventory-management/stock-transfers/hooks/use-stock-transfer-workflow";
import { stockTransferPermissions } from "@/modules/inventory-management/stock-transfers/permissions";
import { useStockTransfer } from "@/modules/inventory-management/stock-transfers/queries";
import {
  STOCK_DOCUMENT_STATUS_LABELS,
  STOCK_DOCUMENT_STATUS_VARIANTS,
  stockTransferDisplayNumber,
  type StockTransfer,
} from "@/modules/inventory-management/stock-transfers/schemas";
import { STOCK_TRANSFER_ACTION_REGISTRY } from "@/modules/inventory-management/stock-transfers/workflow";
import { ActivityFeed } from "@/modules/users-management/activity/components/activity-feed";
import { EntityAttachmentsPanel } from "@/modules/users-management/attachments/components/entity-attachments-panel";
import { useCrudPermissions } from "@/shared/auth/use-crud-permissions";
import { DocumentRecordShell } from "@/shared/components/document/document-record-shell";
import { DocumentStatusBadge } from "@/shared/components/document/document-status-badge";
import { DocumentWorkflowButtons } from "@/shared/components/document/document-workflow-buttons";
import type { RecordPageMode } from "@/shared/components/layout/record-page-header";

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

  if (transferQuery.isLoading || transferQuery.isError || !transfer) {
    return (
      <DocumentRecordShell
        isLoading={transferQuery.isLoading}
        isError={transferQuery.isError || !transfer}
        error={transferQuery.error}
        notFoundMessage="Stock transfer not found"
        onRetry={() => transferQuery.refetch()}
        backHref="/stock-transfers"
        backLabel="Back to transfers"
        title="Stock transfer"
        listHref="/stock-transfers"
        viewHref={viewHref}
        canUpdate={false}
        mode={mode}
        formTitle="Stock transfer"
      >
        {null}
      </DocumentRecordShell>
    );
  }

  return (
    <StockTransferDetailLoaded
      transfer={transfer}
      mode={mode}
      canEditDraft={canEditDraft}
      viewHref={viewHref}
    />
  );
}

function StockTransferDetailLoaded({
  transfer,
  mode,
  canEditDraft,
  viewHref,
}: {
  transfer: StockTransfer;
  mode: RecordPageMode;
  canEditDraft: boolean;
  viewHref: string;
}) {
  const router = useRouter();
  const isEdit = mode === "edit";
  const number = stockTransferDisplayNumber(transfer);
  const onAction = useStockTransferWorkflow(transfer);
  const [writeError, setWriteError] = useState<unknown>(null);

  return (
    <DocumentRecordShell
      isLoading={false}
      isError={false}
      notFoundMessage="Stock transfer not found"
      onRetry={() => undefined}
      backHref="/stock-transfers"
      backLabel="Back to transfers"
      title={number ?? "Stock transfer"}
      subtitle={number ? undefined : "Number not assigned yet"}
      listHref="/stock-transfers"
      viewHref={viewHref}
      editHref={canEditDraft ? `${viewHref}/edit` : undefined}
      canUpdate={canEditDraft}
      mode={mode}
      badges={
        <DocumentStatusBadge
          status={transfer.status}
          labels={STOCK_DOCUMENT_STATUS_LABELS}
          variants={STOCK_DOCUMENT_STATUS_VARIANTS}
        />
      }
      workflow={
        <DocumentWorkflowButtons
          availableActions={transfer.available_actions}
          registry={STOCK_TRANSFER_ACTION_REGISTRY}
          documentKind="stock transfer"
          documentLabel={number ?? "transfer"}
          extra={<StockWriteAlert periodLocked={transfer.period_locked} error={writeError} />}
          onError={(error) => {
            if (isStockWriteAlertError(error)) {
              setWriteError(error);
              return true;
            }
            return false;
          }}
          onAction={async (action, extras) => {
            setWriteError(null);
            await onAction(action, extras);
          }}
        />
      }
      formTitle={isEdit ? "Edit stock transfer" : "Stock transfer"}
      attachments={
        <EntityAttachmentsPanel
          entityType="STOCK_TRANSFER"
          entityId={transfer.id}
          parentPosted={transfer.is_posted}
        />
      }
      activity={
        <ActivityFeed
          entityType="stock_transfer"
          entityId={transfer.id}
          revision={transfer.version}
        />
      }
    >
      <StockTransferForm
        transfer={transfer}
        disabled={!isEdit}
        onSuccess={() => router.push(viewHref)}
      />
    </DocumentRecordShell>
  );
}
