"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  StockWriteAlert,
  isStockWriteAlertError,
} from "@/modules/erp/period-lock/components/stock-write-alert";
import { CreateBillFromGoodsReceiptDialog } from "@/modules/erp/purchase-invoices/components/create-from-goods-receipt-dialog";
import { purchaseInvoicePermissions } from "@/modules/erp/purchase-invoices/permissions";
import { ComposeFromBillsDialog } from "@/modules/erp/landed-costs/components/compose-from-bills-dialog";
import { landedCostPermissions } from "@/modules/erp/landed-costs/permissions";
import { GoodsReceiptForm } from "@/modules/inventory-management/goods-receipts/components/goods-receipt-form";
import { useGoodsReceiptWorkflow } from "@/modules/inventory-management/goods-receipts/hooks/use-goods-receipt-workflow";
import { goodsReceiptPermissions } from "@/modules/inventory-management/goods-receipts/permissions";
import { useGoodsReceipt } from "@/modules/inventory-management/goods-receipts/queries";
import {
  QC_STATUS_LABELS,
  QC_STATUS_VARIANTS,
  STOCK_DOCUMENT_STATUS_LABELS,
  STOCK_DOCUMENT_STATUS_VARIANTS,
  goodsReceiptDisplayNumber,
  qtyIsPositive,
  type GoodsReceipt,
} from "@/modules/inventory-management/goods-receipts/schemas";
import { GOODS_RECEIPT_ACTION_REGISTRY } from "@/modules/inventory-management/goods-receipts/workflow";
import { qualityInspectionPermissions } from "@/modules/inventory-management/quality-inspections/permissions";
import { useQualityInspections } from "@/modules/inventory-management/quality-inspections/queries";
import {
  QUALITY_INSPECTION_STATUS_LABELS,
  QUALITY_INSPECTION_STATUS_VARIANTS,
  qualityInspectionDisplayNumber,
} from "@/modules/inventory-management/quality-inspections/schemas";
import { ActivityFeed } from "@/modules/users-management/activity/components/activity-feed";
import { EntityAttachmentsPanel } from "@/modules/users-management/attachments/components/entity-attachments-panel";
import { useCrudPermissions } from "@/shared/auth/use-crud-permissions";
import { DocumentRecordShell } from "@/shared/components/document/document-record-shell";
import { DocumentLedgerCard } from "@/shared/components/document/document-ledger-card";
import { DocumentStatusBadge } from "@/shared/components/document/document-status-badge";
import { DocumentWorkflowButtons } from "@/shared/components/document/document-workflow-buttons";
import { RelatedDocumentsCard } from "@/shared/components/document/related-documents-card";
import { RecordLink } from "@/shared/components/data-table/record-link";
import type { RecordPageMode } from "@/shared/components/layout/record-page-header";
import { Button } from "@/shared/components/ui/button";
import { useCan } from "@/shared/providers/session-provider";
import { formatDate } from "@/shared/lib/format";

export function GoodsReceiptDetailScreen({
  receiptId,
  mode,
}: {
  receiptId: string;
  mode: RecordPageMode;
}) {
  const router = useRouter();
  const { canUpdate } = useCrudPermissions(goodsReceiptPermissions);
  const receiptQuery = useGoodsReceipt(receiptId);
  const receipt = receiptQuery.data;
  const isDraft = receipt?.status === "DRAFT";
  const isEdit = mode === "edit";
  const viewHref = `/goods-receipts/${receiptId}`;
  const canEditDraft = Boolean(isDraft && canUpdate);

  useEffect(() => {
    if (isEdit && receipt && receipt.status !== "DRAFT") {
      router.replace(viewHref);
    }
  }, [isEdit, receipt, router, viewHref]);

  if (receiptQuery.isLoading || receiptQuery.isError || !receipt) {
    return (
      <DocumentRecordShell
        isLoading={receiptQuery.isLoading}
        isError={receiptQuery.isError || !receipt}
        error={receiptQuery.error}
        notFoundMessage="Goods receipt not found"
        onRetry={() => receiptQuery.refetch()}
        backHref="/goods-receipts"
        backLabel="Back to goods receipts"
        title="Goods receipt"
        listHref="/goods-receipts"
        viewHref={viewHref}
        canUpdate={false}
        mode={mode}
        formTitle="Goods receipt"
      >
        {null}
      </DocumentRecordShell>
    );
  }

  return (
    <GoodsReceiptDetailLoaded
      receipt={receipt}
      mode={mode}
      canEditDraft={canEditDraft}
      viewHref={viewHref}
    />
  );
}

function GoodsReceiptDetailLoaded({
  receipt,
  mode,
  canEditDraft,
  viewHref,
}: {
  receipt: GoodsReceipt;
  mode: RecordPageMode;
  canEditDraft: boolean;
  viewHref: string;
}) {
  const router = useRouter();
  const can = useCan();
  const isEdit = mode === "edit";
  const number = goodsReceiptDisplayNumber(receipt);
  const onAction = useGoodsReceiptWorkflow(receipt);
  const [writeError, setWriteError] = useState<unknown>(null);
  const [billOpen, setBillOpen] = useState(false);
  const [landedCostOpen, setLandedCostOpen] = useState(false);
  const canCreateBill = receipt.status === "POSTED" && can(purchaseInvoicePermissions.create);
  const canCreateLandedCost = receipt.status === "POSTED" && can(landedCostPermissions.create);
  const canReadInspections = can(qualityInspectionPermissions.read);
  const inspectionsQuery = useQualityInspections(
    {
      goods_receipt_id: receipt.id,
      page_size: 100,
    },
    canReadInspections,
  );
  const inspections = inspectionsQuery.data?.data ?? [];
  const holdRemaining = receipt.lines.some((line) => qtyIsPositive(line.qty_on_hold));

  return (
    <DocumentRecordShell
      isLoading={false}
      isError={false}
      notFoundMessage="Goods receipt not found"
      onRetry={() => undefined}
      backHref="/goods-receipts"
      backLabel="Back to goods receipts"
      title={number ?? "Goods receipt"}
      subtitle={number ? undefined : "Number not assigned yet"}
      listHref="/goods-receipts"
      viewHref={viewHref}
      editHref={canEditDraft ? `${viewHref}/edit` : undefined}
      canUpdate={canEditDraft}
      mode={mode}
      badges={
        <>
          <DocumentStatusBadge
            status={receipt.status}
            labels={STOCK_DOCUMENT_STATUS_LABELS}
            variants={STOCK_DOCUMENT_STATUS_VARIANTS}
          />
          <DocumentStatusBadge
            status={receipt.qc_status}
            labels={QC_STATUS_LABELS}
            variants={QC_STATUS_VARIANTS}
          />
        </>
      }
      workflow={
        <div className="flex flex-col items-end gap-2">
          {canCreateBill ? (
            <Button type="button" size="sm" variant="outline" onClick={() => setBillOpen(true)}>
              Create bill
            </Button>
          ) : null}
          {canCreateLandedCost ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setLandedCostOpen(true)}
            >
              Create landed cost
            </Button>
          ) : null}
          <DocumentWorkflowButtons
            availableActions={receipt.available_actions}
            registry={GOODS_RECEIPT_ACTION_REGISTRY}
            documentKind="goods receipt"
            documentLabel={number ?? "goods receipt"}
            extra={<StockWriteAlert periodLocked={receipt.period_locked} error={writeError} />}
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
        <div className="flex flex-col gap-2">
          {receipt.purchase_order_id ? (
            <p className="text-muted-foreground text-sm">
              Received against{" "}
              <Link
                href={`/purchase-orders/${receipt.purchase_order_id}`}
                className="text-foreground underline-offset-4 hover:underline"
              >
                purchase order
              </Link>
              .
            </p>
          ) : (
            <p className="text-muted-foreground text-sm">Direct receive — no purchase order.</p>
          )}
          {canReadInspections && (inspections.length > 0 || holdRemaining) ? (
            <div className="flex flex-col gap-1 text-sm">
              <p className="font-medium">Quality inspections</p>
              {inspections.length === 0 ? (
                <p className="text-muted-foreground">No inspections recorded yet.</p>
              ) : (
                <ul className="flex flex-col gap-1">
                  {inspections.map((inspection) => (
                    <li key={inspection.id} className="flex flex-wrap items-center gap-2">
                      <RecordLink href={`/quality-inspections/${inspection.id}`}>
                        {qualityInspectionDisplayNumber(inspection) ?? "Inspection"}
                      </RecordLink>
                      <DocumentStatusBadge
                        status={inspection.status}
                        labels={QUALITY_INSPECTION_STATUS_LABELS}
                        variants={QUALITY_INSPECTION_STATUS_VARIANTS}
                      />
                      <span className="text-muted-foreground">
                        {formatDate(inspection.inspection_date)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : null}
        </div>
      }
      formTitle={isEdit ? "Edit goods receipt" : "Goods receipt"}
      panels={
        <>
          <RelatedDocumentsCard documents={receipt.related_documents} />
          <DocumentLedgerCard journalEntryId={receipt.journal_entry_id} />
        </>
      }
      attachments={
        <EntityAttachmentsPanel
          entityType="GOODS_RECEIPT"
          entityId={receipt.id}
          parentPosted={receipt.is_posted}
          defaultCategory="SUPPLIER_INVOICE"
        />
      }
      activity={
        <ActivityFeed
          entityType="goods_receipt"
          entityId={receipt.id}
          revision={receipt.version}
        />
      }
    >
      <GoodsReceiptForm
        receipt={receipt}
        disabled={!isEdit}
        onSuccess={() => router.push(viewHref)}
      />
      <CreateBillFromGoodsReceiptDialog
        open={billOpen}
        onOpenChange={setBillOpen}
        goodsReceiptId={receipt.id}
      />
      <ComposeFromBillsDialog
        open={landedCostOpen}
        onOpenChange={setLandedCostOpen}
        goodsReceiptId={receipt.id}
      />
    </DocumentRecordShell>
  );
}
