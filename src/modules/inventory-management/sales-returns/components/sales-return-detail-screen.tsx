"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  StockWriteAlert,
  isStockWriteAlertError,
} from "@/modules/erp/period-lock/components/stock-write-alert";
import { SalesReturnForm } from "@/modules/inventory-management/sales-returns/components/sales-return-form";
import { useSalesReturnWorkflow } from "@/modules/inventory-management/sales-returns/hooks/use-sales-return-workflow";
import { salesReturnPermissions } from "@/modules/inventory-management/sales-returns/permissions";
import { useSalesReturn } from "@/modules/inventory-management/sales-returns/queries";
import {
  STOCK_DOCUMENT_STATUS_LABELS,
  STOCK_DOCUMENT_STATUS_VARIANTS,
  salesReturnDisplayNumber,
  type SalesReturn,
} from "@/modules/inventory-management/sales-returns/schemas";
import { SALES_RETURN_ACTION_REGISTRY } from "@/modules/inventory-management/sales-returns/workflow";
import { ActivityFeed } from "@/modules/users-management/activity/components/activity-feed";
import { EntityAttachmentsPanel } from "@/modules/users-management/attachments/components/entity-attachments-panel";
import { useCrudPermissions } from "@/shared/auth/use-crud-permissions";
import { DocumentRecordShell } from "@/shared/components/document/document-record-shell";
import { DocumentStatusBadge } from "@/shared/components/document/document-status-badge";
import { DocumentWorkflowButtons } from "@/shared/components/document/document-workflow-buttons";
import type { RecordPageMode } from "@/shared/components/layout/record-page-header";

export function SalesReturnDetailScreen({
  returnId,
  mode,
}: {
  returnId: string;
  mode: RecordPageMode;
}) {
  const router = useRouter();
  const { canUpdate } = useCrudPermissions(salesReturnPermissions);
  const returnQuery = useSalesReturn(returnId);
  const doc = returnQuery.data;
  const isDraft = doc?.status === "DRAFT";
  const isEdit = mode === "edit";
  const viewHref = `/sales-returns/${returnId}`;
  const canEditDraft = Boolean(isDraft && canUpdate);

  useEffect(() => {
    if (isEdit && doc && doc.status !== "DRAFT") {
      router.replace(viewHref);
    }
  }, [doc, isEdit, router, viewHref]);

  if (returnQuery.isLoading || returnQuery.isError || !doc) {
    return (
      <DocumentRecordShell
        isLoading={returnQuery.isLoading}
        isError={returnQuery.isError || !doc}
        error={returnQuery.error}
        notFoundMessage="Sales return not found"
        onRetry={() => returnQuery.refetch()}
        backHref="/sales-returns"
        backLabel="Back to sales returns"
        title="Sales return"
        listHref="/sales-returns"
        viewHref={viewHref}
        canUpdate={false}
        mode={mode}
        formTitle="Sales return"
      >
        {null}
      </DocumentRecordShell>
    );
  }

  return (
    <SalesReturnDetailLoaded doc={doc} mode={mode} canEditDraft={canEditDraft} viewHref={viewHref} />
  );
}

function SalesReturnDetailLoaded({
  doc,
  mode,
  canEditDraft,
  viewHref,
}: {
  doc: SalesReturn;
  mode: RecordPageMode;
  canEditDraft: boolean;
  viewHref: string;
}) {
  const router = useRouter();
  const isEdit = mode === "edit";
  const number = salesReturnDisplayNumber(doc);
  const onAction = useSalesReturnWorkflow(doc);
  const [writeError, setWriteError] = useState<unknown>(null);

  return (
    <DocumentRecordShell
      isLoading={false}
      isError={false}
      notFoundMessage="Sales return not found"
      onRetry={() => undefined}
      backHref="/sales-returns"
      backLabel="Back to sales returns"
      title={number ?? "Sales return"}
      listHref="/sales-returns"
      viewHref={viewHref}
      editHref={canEditDraft ? `${viewHref}/edit` : undefined}
      canUpdate={canEditDraft}
      mode={mode}
      badges={
        <DocumentStatusBadge
          status={doc.status}
          labels={STOCK_DOCUMENT_STATUS_LABELS}
          variants={STOCK_DOCUMENT_STATUS_VARIANTS}
        />
      }
      workflow={
        <DocumentWorkflowButtons
          availableActions={doc.available_actions}
          registry={SALES_RETURN_ACTION_REGISTRY}
          documentKind="sales return"
          documentLabel={number ?? "sales return"}
          extra={<StockWriteAlert periodLocked={doc.period_locked} error={writeError} />}
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
      banner={
        <p className="text-muted-foreground text-sm">
          Against{" "}
          <Link
            href={`/delivery-notes/${doc.delivery_note_id}`}
            className="text-foreground underline-offset-4 hover:underline"
          >
            delivery note
          </Link>
          {" · "}
          <Link
            href={`/sales-orders/${doc.sales_order_id}`}
            className="text-foreground underline-offset-4 hover:underline"
          >
            sales order
          </Link>
          . Posting restores original cost; scrap writes that cost off.
        </p>
      }
      formTitle={isEdit ? "Edit sales return" : "Sales return"}
      attachments={
        <EntityAttachmentsPanel
          entityType="SALES_RETURN"
          entityId={doc.id}
          parentPosted={doc.is_posted}
          defaultCategory="RETURN_PHOTO"
        />
      }
      activity={
        <ActivityFeed entityType="sales_return" entityId={doc.id} revision={doc.version} />
      }
    >
      <SalesReturnForm doc={doc} disabled={!isEdit} onSuccess={() => router.push(viewHref)} />
    </DocumentRecordShell>
  );
}
