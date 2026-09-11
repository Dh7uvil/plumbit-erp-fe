"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { CreateDebitNoteDialog } from "@/modules/erp/debit-notes/components/create-from-source-dialog";
import { debitNotePermissions } from "@/modules/erp/debit-notes/permissions";
import {
  StockWriteAlert,
  isStockWriteAlertError,
} from "@/modules/erp/period-lock/components/stock-write-alert";
import { PurchaseReturnForm } from "@/modules/inventory-management/purchase-returns/components/purchase-return-form";
import { usePurchaseReturnWorkflow } from "@/modules/inventory-management/purchase-returns/hooks/use-purchase-return-workflow";
import { purchaseReturnPermissions } from "@/modules/inventory-management/purchase-returns/permissions";
import { usePurchaseReturn } from "@/modules/inventory-management/purchase-returns/queries";
import {
  STOCK_DOCUMENT_STATUS_LABELS,
  STOCK_DOCUMENT_STATUS_VARIANTS,
  purchaseReturnDisplayNumber,
  type PurchaseReturn,
} from "@/modules/inventory-management/purchase-returns/schemas";
import { PURCHASE_RETURN_ACTION_REGISTRY } from "@/modules/inventory-management/purchase-returns/workflow";
import { ActivityFeed } from "@/modules/users-management/activity/components/activity-feed";
import { EntityAttachmentsPanel } from "@/modules/users-management/attachments/components/entity-attachments-panel";
import { useCrudPermissions } from "@/shared/auth/use-crud-permissions";
import { DocumentRecordShell } from "@/shared/components/document/document-record-shell";
import { DocumentStatusBadge } from "@/shared/components/document/document-status-badge";
import { DocumentWorkflowButtons } from "@/shared/components/document/document-workflow-buttons";
import { RelatedDocumentsCard } from "@/shared/components/document/related-documents-card";
import type { RecordPageMode } from "@/shared/components/layout/record-page-header";
import { Button } from "@/shared/components/ui/button";
import { useCan } from "@/shared/providers/session-provider";

export function PurchaseReturnDetailScreen({
  returnId,
  mode,
}: {
  returnId: string;
  mode: RecordPageMode;
}) {
  const router = useRouter();
  const { canUpdate } = useCrudPermissions(purchaseReturnPermissions);
  const returnQuery = usePurchaseReturn(returnId);
  const doc = returnQuery.data;
  const isDraft = doc?.status === "DRAFT";
  const isEdit = mode === "edit";
  const viewHref = `/purchase-returns/${returnId}`;
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
        notFoundMessage="Purchase return not found"
        onRetry={() => returnQuery.refetch()}
        backHref="/purchase-returns"
        backLabel="Back to purchase returns"
        title="Purchase return"
        listHref="/purchase-returns"
        viewHref={viewHref}
        canUpdate={false}
        mode={mode}
        formTitle="Purchase return"
      >
        {null}
      </DocumentRecordShell>
    );
  }

  return (
    <PurchaseReturnDetailLoaded
      doc={doc}
      mode={mode}
      canEditDraft={canEditDraft}
      viewHref={viewHref}
    />
  );
}

function PurchaseReturnDetailLoaded({
  doc,
  mode,
  canEditDraft,
  viewHref,
}: {
  doc: PurchaseReturn;
  mode: RecordPageMode;
  canEditDraft: boolean;
  viewHref: string;
}) {
  const router = useRouter();
  const can = useCan();
  const isEdit = mode === "edit";
  const number = purchaseReturnDisplayNumber(doc);
  const onAction = usePurchaseReturnWorkflow(doc);
  const [writeError, setWriteError] = useState<unknown>(null);
  const [debitOpen, setDebitOpen] = useState(false);
  const canCreateDebit = doc.status === "POSTED" && can(debitNotePermissions.create);

  return (
    <DocumentRecordShell
      isLoading={false}
      isError={false}
      notFoundMessage="Purchase return not found"
      onRetry={() => undefined}
      backHref="/purchase-returns"
      backLabel="Back to purchase returns"
      title={number ?? "Purchase return"}
      listHref="/purchase-returns"
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
        <div className="flex flex-col items-end gap-2">
          {canCreateDebit ? (
            <Button type="button" size="sm" variant="outline" onClick={() => setDebitOpen(true)}>
              Create debit note
            </Button>
          ) : null}
          <DocumentWorkflowButtons
            availableActions={doc.available_actions}
            registry={PURCHASE_RETURN_ACTION_REGISTRY}
            documentKind="purchase return"
            documentLabel={number ?? "purchase return"}
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
        </div>
      }
      banner={
        <p className="text-muted-foreground text-sm">
          Against{" "}
          <Link
            href={`/goods-receipts/${doc.goods_receipt_id}`}
            className="text-foreground underline-offset-4 hover:underline"
          >
            goods receipt
          </Link>
          {doc.purchase_order_id ? (
            <>
              {" · "}
              <Link
                href={`/purchase-orders/${doc.purchase_order_id}`}
                className="text-foreground underline-offset-4 hover:underline"
              >
                purchase order
              </Link>
            </>
          ) : null}
          . Posting consumes original GRN cost layers; a debit note reduces AP.
        </p>
      }
      formTitle={isEdit ? "Edit purchase return" : "Purchase return"}
      panels={<RelatedDocumentsCard documents={doc.related_documents} />}
      attachments={
        <EntityAttachmentsPanel
          entityType="PURCHASE_RETURN"
          entityId={doc.id}
          parentPosted={doc.is_posted}
          defaultCategory="RETURN_PHOTO"
        />
      }
      activity={
        <ActivityFeed entityType="purchase_return" entityId={doc.id} revision={doc.version} />
      }
    >
      <PurchaseReturnForm doc={doc} disabled={!isEdit} onSuccess={() => router.push(viewHref)} />
      <CreateDebitNoteDialog
        open={debitOpen}
        onOpenChange={setDebitOpen}
        purchaseReturnId={doc.id}
      />
    </DocumentRecordShell>
  );
}
