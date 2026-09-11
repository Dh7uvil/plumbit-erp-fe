"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  StockWriteAlert,
  isStockWriteAlertError,
} from "@/modules/erp/period-lock/components/stock-write-alert";
import { QualityInspectionForm } from "@/modules/inventory-management/quality-inspections/components/quality-inspection-form";
import { useQualityInspectionWorkflow } from "@/modules/inventory-management/quality-inspections/hooks/use-quality-inspection-workflow";
import { qualityInspectionPermissions } from "@/modules/inventory-management/quality-inspections/permissions";
import { useQualityInspection } from "@/modules/inventory-management/quality-inspections/queries";
import {
  QUALITY_INSPECTION_STATUS_LABELS,
  QUALITY_INSPECTION_STATUS_VARIANTS,
  qualityInspectionDisplayNumber,
  type QualityInspection,
} from "@/modules/inventory-management/quality-inspections/schemas";
import { QUALITY_INSPECTION_ACTION_REGISTRY } from "@/modules/inventory-management/quality-inspections/workflow";
import { purchaseReturnPermissions } from "@/modules/inventory-management/purchase-returns/permissions";
import { ActivityFeed } from "@/modules/users-management/activity/components/activity-feed";
import { EntityAttachmentsPanel } from "@/modules/users-management/attachments/components/entity-attachments-panel";
import { useCrudPermissions } from "@/shared/auth/use-crud-permissions";
import { DocumentRecordShell } from "@/shared/components/document/document-record-shell";
import { DocumentStatusBadge } from "@/shared/components/document/document-status-badge";
import { RelatedDocumentsCard } from "@/shared/components/document/related-documents-card";
import { DocumentWorkflowButtons } from "@/shared/components/document/document-workflow-buttons";
import type { RecordPageMode } from "@/shared/components/layout/record-page-header";
import { useCan } from "@/shared/providers/session-provider";

export function QualityInspectionDetailScreen({
  inspectionId,
  mode,
}: {
  inspectionId: string;
  mode: RecordPageMode;
}) {
  const router = useRouter();
  const { canUpdate } = useCrudPermissions(qualityInspectionPermissions);
  const inspectionQuery = useQualityInspection(inspectionId);
  const inspection = inspectionQuery.data;
  const isDraft = inspection?.status === "DRAFT";
  const isEdit = mode === "edit";
  const viewHref = `/quality-inspections/${inspectionId}`;
  const canEditDraft = Boolean(isDraft && canUpdate);

  useEffect(() => {
    if (isEdit && inspection && inspection.status !== "DRAFT") {
      router.replace(viewHref);
    }
  }, [inspection, isEdit, router, viewHref]);

  if (inspectionQuery.isLoading || inspectionQuery.isError || !inspection) {
    return (
      <DocumentRecordShell
        isLoading={inspectionQuery.isLoading}
        isError={inspectionQuery.isError || !inspection}
        error={inspectionQuery.error}
        notFoundMessage="Quality inspection not found"
        onRetry={() => inspectionQuery.refetch()}
        backHref="/quality-inspections"
        backLabel="Back to inspections"
        title="Quality inspection"
        listHref="/quality-inspections"
        viewHref={viewHref}
        canUpdate={false}
        mode={mode}
        formTitle="Quality inspection"
      >
        {null}
      </DocumentRecordShell>
    );
  }

  return (
    <QualityInspectionDetailLoaded
      inspection={inspection}
      mode={mode}
      canEditDraft={canEditDraft}
      viewHref={viewHref}
    />
  );
}

function QualityInspectionDetailLoaded({
  inspection,
  mode,
  canEditDraft,
  viewHref,
}: {
  inspection: QualityInspection;
  mode: RecordPageMode;
  canEditDraft: boolean;
  viewHref: string;
}) {
  const router = useRouter();
  const can = useCan();
  const isEdit = mode === "edit";
  const number = qualityInspectionDisplayNumber(inspection);
  const onAction = useQualityInspectionWorkflow(inspection);
  const [writeError, setWriteError] = useState<unknown>(null);
  const workflowActions =
    inspection.status === "APPROVED" &&
    can(purchaseReturnPermissions.create) &&
    !inspection.available_actions.includes("create_purchase_return")
      ? [...inspection.available_actions, "create_purchase_return"]
      : inspection.available_actions;

  return (
    <DocumentRecordShell
      isLoading={false}
      isError={false}
      notFoundMessage="Quality inspection not found"
      onRetry={() => undefined}
      backHref="/quality-inspections"
      backLabel="Back to inspections"
      title={number ?? "Quality inspection"}
      subtitle={number ? undefined : "Number not assigned yet"}
      listHref="/quality-inspections"
      viewHref={viewHref}
      editHref={canEditDraft ? `${viewHref}/edit` : undefined}
      canUpdate={canEditDraft}
      mode={mode}
      badges={
        <DocumentStatusBadge
          status={inspection.status}
          labels={QUALITY_INSPECTION_STATUS_LABELS}
          variants={QUALITY_INSPECTION_STATUS_VARIANTS}
        />
      }
      workflow={
        <DocumentWorkflowButtons
          availableActions={workflowActions}
          registry={QUALITY_INSPECTION_ACTION_REGISTRY}
          documentKind="quality inspection"
          documentLabel={number ?? "inspection"}
          extra={<StockWriteAlert periodLocked={inspection.period_locked} error={writeError} />}
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
          Inspection of{" "}
          <Link
            href={`/goods-receipts/${inspection.goods_receipt_id}`}
            className="text-foreground underline-offset-4 hover:underline"
          >
            goods receipt
          </Link>
          .
        </p>
      }
      formTitle={isEdit ? "Edit quality inspection" : "Quality inspection"}
      attachments={
        <EntityAttachmentsPanel
          entityType="QUALITY_INSPECTION"
          entityId={inspection.id}
          parentPosted={inspection.status !== "DRAFT"}
          defaultCategory="QC_PHOTO"
        />
      }
        activity={
          <ActivityFeed
            entityType="quality_inspection"
            entityId={inspection.id}
            revision={inspection.version}
          />
        }
        panels={<RelatedDocumentsCard documents={inspection.related_documents} />}
      >
      <QualityInspectionForm
        inspection={inspection}
        disabled={!isEdit}
        onSuccess={() => router.push(viewHref)}
      />
    </DocumentRecordShell>
  );
}
