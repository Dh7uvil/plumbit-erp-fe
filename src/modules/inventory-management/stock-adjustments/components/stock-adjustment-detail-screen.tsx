"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  StockWriteAlert,
  isStockWriteAlertError,
} from "@/modules/erp/period-lock/components/stock-write-alert";
import { StockAdjustmentForm } from "@/modules/inventory-management/stock-adjustments/components/stock-adjustment-form";
import { useStockAdjustmentWorkflow } from "@/modules/inventory-management/stock-adjustments/hooks/use-stock-adjustment-workflow";
import { stockAdjustmentPermissions } from "@/modules/inventory-management/stock-adjustments/permissions";
import { useStockAdjustment } from "@/modules/inventory-management/stock-adjustments/queries";
import {
  STOCK_DOCUMENT_STATUS_LABELS,
  STOCK_DOCUMENT_STATUS_VARIANTS,
  stockAdjustmentDisplayNumber,
  type StockAdjustment,
} from "@/modules/inventory-management/stock-adjustments/schemas";
import { STOCK_ADJUSTMENT_ACTION_REGISTRY } from "@/modules/inventory-management/stock-adjustments/workflow";
import { ActivityFeed } from "@/modules/users-management/activity/components/activity-feed";
import { EntityAttachmentsPanel } from "@/modules/users-management/attachments/components/entity-attachments-panel";
import { useCrudPermissions } from "@/shared/auth/use-crud-permissions";
import { DocumentRecordShell } from "@/shared/components/document/document-record-shell";
import { DocumentLedgerCard } from "@/shared/components/document/document-ledger-card";
import { DocumentStatusBadge } from "@/shared/components/document/document-status-badge";
import { DocumentWorkflowButtons } from "@/shared/components/document/document-workflow-buttons";
import type { RecordPageMode } from "@/shared/components/layout/record-page-header";

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

  if (adjustmentQuery.isLoading || adjustmentQuery.isError || !adjustment) {
    return (
      <DocumentRecordShell
        isLoading={adjustmentQuery.isLoading}
        isError={adjustmentQuery.isError || !adjustment}
        error={adjustmentQuery.error}
        notFoundMessage="Stock adjustment not found"
        onRetry={() => adjustmentQuery.refetch()}
        backHref="/stock-adjustments"
        backLabel="Back to adjustments"
        title="Stock adjustment"
        listHref="/stock-adjustments"
        viewHref={viewHref}
        canUpdate={false}
        mode={mode}
        formTitle="Stock adjustment"
      >
        {null}
      </DocumentRecordShell>
    );
  }

  return (
    <StockAdjustmentDetailLoaded
      adjustment={adjustment}
      mode={mode}
      canEditDraft={canEditDraft}
      viewHref={viewHref}
    />
  );
}

function StockAdjustmentDetailLoaded({
  adjustment,
  mode,
  canEditDraft,
  viewHref,
}: {
  adjustment: StockAdjustment;
  mode: RecordPageMode;
  canEditDraft: boolean;
  viewHref: string;
}) {
  const router = useRouter();
  const isEdit = mode === "edit";
  const number = stockAdjustmentDisplayNumber(adjustment);
  const onAction = useStockAdjustmentWorkflow(adjustment);
  const [writeError, setWriteError] = useState<unknown>(null);

  return (
    <DocumentRecordShell
      isLoading={false}
      isError={false}
      notFoundMessage="Stock adjustment not found"
      onRetry={() => undefined}
      backHref="/stock-adjustments"
      backLabel="Back to adjustments"
      title={number ?? "Stock adjustment"}
      subtitle={number ? undefined : "Number not assigned yet"}
      listHref="/stock-adjustments"
      viewHref={viewHref}
      editHref={canEditDraft ? `${viewHref}/edit` : undefined}
      canUpdate={canEditDraft}
      mode={mode}
      badges={
        <DocumentStatusBadge
          status={adjustment.status}
          labels={STOCK_DOCUMENT_STATUS_LABELS}
          variants={STOCK_DOCUMENT_STATUS_VARIANTS}
        />
      }
      workflow={
        <DocumentWorkflowButtons
          availableActions={adjustment.available_actions}
          registry={STOCK_ADJUSTMENT_ACTION_REGISTRY}
          documentKind="stock adjustment"
          documentLabel={number ?? "adjustment"}
          extra={<StockWriteAlert periodLocked={adjustment.period_locked} error={writeError} />}
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
      formTitle={isEdit ? "Edit stock adjustment" : "Stock adjustment"}
      panels={<DocumentLedgerCard journalEntryId={adjustment.journal_entry_id} />}
      attachments={
        <EntityAttachmentsPanel
          entityType="STOCK_ADJUSTMENT"
          entityId={adjustment.id}
          parentPosted={adjustment.is_posted}
        />
      }
      activity={
        <ActivityFeed
          entityType="stock_adjustment"
          entityId={adjustment.id}
          revision={adjustment.version}
        />
      }
    >
      <StockAdjustmentForm
        adjustment={adjustment}
        disabled={!isEdit}
        onSuccess={() => router.push(viewHref)}
      />
    </DocumentRecordShell>
  );
}
