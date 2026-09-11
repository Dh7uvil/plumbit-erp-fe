"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { LandedCostForm } from "@/modules/erp/landed-costs/components/landed-cost-form";
import { useLandedCostWorkflow } from "@/modules/erp/landed-costs/hooks/use-landed-cost-workflow";
import { landedCostPermissions } from "@/modules/erp/landed-costs/permissions";
import { useLandedCost } from "@/modules/erp/landed-costs/queries";
import {
  STOCK_DOCUMENT_STATUS_LABELS,
  STOCK_DOCUMENT_STATUS_VARIANTS,
  landedCostDisplayNumber,
  type LandedCost,
} from "@/modules/erp/landed-costs/schemas";
import { LANDED_COST_ACTION_REGISTRY } from "@/modules/erp/landed-costs/workflow";
import {
  StockWriteAlert,
  isStockWriteAlertError,
} from "@/modules/erp/period-lock/components/stock-write-alert";
import { ActivityFeed } from "@/modules/users-management/activity/components/activity-feed";
import { EntityAttachmentsPanel } from "@/modules/users-management/attachments/components/entity-attachments-panel";
import { useCrudPermissions } from "@/shared/auth/use-crud-permissions";
import { DocumentLedgerCard } from "@/shared/components/document/document-ledger-card";
import { DocumentRecordShell } from "@/shared/components/document/document-record-shell";
import { DocumentStatusBadge } from "@/shared/components/document/document-status-badge";
import { RelatedDocumentsCard } from "@/shared/components/document/related-documents-card";
import { DocumentWorkflowButtons } from "@/shared/components/document/document-workflow-buttons";
import type { RecordPageMode } from "@/shared/components/layout/record-page-header";

export function LandedCostDetailScreen({
  landedCostId,
  mode,
}: {
  landedCostId: string;
  mode: RecordPageMode;
}) {
  const router = useRouter();
  const { canUpdate } = useCrudPermissions(landedCostPermissions);
  const documentQuery = useLandedCost(landedCostId);
  const document = documentQuery.data;
  const isDraft = document?.status === "DRAFT";
  const isEdit = mode === "edit";
  const viewHref = `/landed-costs/${landedCostId}`;
  const canEditDraft = Boolean(isDraft && canUpdate);

  useEffect(() => {
    if (isEdit && document && document.status !== "DRAFT") {
      router.replace(viewHref);
    }
  }, [document, isEdit, router, viewHref]);

  if (documentQuery.isLoading || documentQuery.isError || !document) {
    return (
      <DocumentRecordShell
        isLoading={documentQuery.isLoading}
        isError={documentQuery.isError || !document}
        error={documentQuery.error}
        notFoundMessage="Landed cost not found"
        onRetry={() => documentQuery.refetch()}
        backHref="/landed-costs"
        backLabel="Back to landed costs"
        title="Landed cost"
        listHref="/landed-costs"
        viewHref={viewHref}
        canUpdate={false}
        mode={mode}
        formTitle="Landed cost"
      >
        {null}
      </DocumentRecordShell>
    );
  }

  return (
    <LandedCostDetailLoaded
      document={document}
      mode={mode}
      canEditDraft={canEditDraft}
      viewHref={viewHref}
    />
  );
}

function LandedCostDetailLoaded({
  document,
  mode,
  canEditDraft,
  viewHref,
}: {
  document: LandedCost;
  mode: RecordPageMode;
  canEditDraft: boolean;
  viewHref: string;
}) {
  const router = useRouter();
  const isEdit = mode === "edit";
  const number = landedCostDisplayNumber(document);
  const onAction = useLandedCostWorkflow(document);
  const [writeError, setWriteError] = useState<unknown>(null);

  return (
    <DocumentRecordShell
      isLoading={false}
      isError={false}
      notFoundMessage="Landed cost not found"
      onRetry={() => undefined}
      backHref="/landed-costs"
      backLabel="Back to landed costs"
      title={number ?? "Landed cost"}
      subtitle={number ? undefined : "Number not assigned yet"}
      listHref="/landed-costs"
      viewHref={viewHref}
      editHref={canEditDraft ? `${viewHref}/edit` : undefined}
      canUpdate={canEditDraft}
      mode={mode}
      badges={
        <DocumentStatusBadge
          status={document.status}
          labels={STOCK_DOCUMENT_STATUS_LABELS}
          variants={STOCK_DOCUMENT_STATUS_VARIANTS}
        />
      }
      workflow={
        <DocumentWorkflowButtons
          availableActions={document.available_actions}
          registry={LANDED_COST_ACTION_REGISTRY}
          documentKind="landed cost"
          documentLabel={number ?? "landed cost"}
          extra={<StockWriteAlert periodLocked={document.period_locked} error={writeError} />}
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
      formTitle={isEdit ? "Edit landed cost" : "Landed cost"}
      panels={
        <>
          <RelatedDocumentsCard documents={document.related_documents} />
          <DocumentLedgerCard
            journalEntryId={document.journal_entry_id}
            reversalJournalEntryId={document.reversal_journal_entry_id}
          />
        </>
      }
      attachments={
        <EntityAttachmentsPanel
          entityType="LANDED_COST"
          entityId={document.id}
          parentPosted={document.is_posted}
        />
      }
      activity={
        <ActivityFeed entityType="landed_cost" entityId={document.id} revision={document.version} />
      }
    >
      <LandedCostForm
        document={document}
        disabled={!isEdit}
        onSuccess={() => router.push(viewHref)}
      />
    </DocumentRecordShell>
  );
}
