"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { journalBalanceTotals } from "@/modules/erp/accounting/journals/balance";
import { JournalForm } from "@/modules/erp/accounting/journals/components/journal-form";
import { useJournalWorkflow } from "@/modules/erp/accounting/journals/hooks/use-journal-workflow";
import { journalPermissions } from "@/modules/erp/accounting/journals/permissions";
import { useJournal } from "@/modules/erp/accounting/journals/queries";
import {
  JOURNAL_STATUS_LABELS,
  JOURNAL_STATUS_VARIANTS,
  JOURNAL_TYPE_LABELS,
  journalDisplayNumber,
  type JournalEntry,
} from "@/modules/erp/accounting/journals/schemas";
import { JOURNAL_ACTION_REGISTRY } from "@/modules/erp/accounting/journals/workflow";
import {
  StockWriteAlert,
  isStockWriteAlertError,
} from "@/modules/erp/period-lock/components/stock-write-alert";
import { ActivityFeed } from "@/modules/users-management/activity/components/activity-feed";
import { EntityAttachmentsPanel } from "@/modules/users-management/attachments/components/entity-attachments-panel";
import { useCrudPermissions } from "@/shared/auth/use-crud-permissions";
import { DocumentRecordShell } from "@/shared/components/document/document-record-shell";
import { DocumentStatusBadge } from "@/shared/components/document/document-status-badge";
import { DocumentWorkflowButtons } from "@/shared/components/document/document-workflow-buttons";
import type { RecordPageMode } from "@/shared/components/layout/record-page-header";
import { Badge } from "@/shared/components/ui/badge";

export function JournalDetailScreen({
  journalId,
  mode,
}: {
  journalId: string;
  mode: RecordPageMode;
}) {
  const router = useRouter();
  const { canUpdate } = useCrudPermissions(journalPermissions);
  const journalQuery = useJournal(journalId);
  const journal = journalQuery.data;
  const isDraft = journal?.status === "DRAFT";
  const isEdit = mode === "edit";
  const viewHref = `/journals/${journalId}`;
  const canEditDraft = Boolean(isDraft && canUpdate);

  useEffect(() => {
    if (isEdit && journal && journal.status !== "DRAFT") {
      router.replace(viewHref);
    }
  }, [isEdit, router, journal, viewHref]);

  if (journalQuery.isLoading || journalQuery.isError || !journal) {
    return (
      <DocumentRecordShell
        isLoading={journalQuery.isLoading}
        isError={journalQuery.isError || !journal}
        error={journalQuery.error}
        notFoundMessage="Journal not found"
        onRetry={() => journalQuery.refetch()}
        backHref="/journals"
        backLabel="Back to journals"
        title="Journal"
        listHref="/journals"
        viewHref={viewHref}
        canUpdate={false}
        mode={mode}
        formTitle="Journal"
      >
        {null}
      </DocumentRecordShell>
    );
  }

  return (
    <JournalDetailLoaded
      journal={journal}
      mode={mode}
      canEditDraft={canEditDraft}
      viewHref={viewHref}
    />
  );
}

function JournalDetailLoaded({
  journal,
  mode,
  canEditDraft,
  viewHref,
}: {
  journal: JournalEntry;
  mode: RecordPageMode;
  canEditDraft: boolean;
  viewHref: string;
}) {
  const router = useRouter();
  const isEdit = mode === "edit";
  const number = journalDisplayNumber(journal);
  const onAction = useJournalWorkflow(journal);
  const [writeError, setWriteError] = useState<unknown>(null);
  const balanced = journalBalanceTotals(
    journal.lines.map((line) => ({ debit: line.debit, credit: line.credit })),
  ).isBalanced;

  return (
    <DocumentRecordShell
      isLoading={false}
      isError={false}
      notFoundMessage="Journal not found"
      onRetry={() => undefined}
      backHref="/journals"
      backLabel="Back to journals"
      title={number ?? "Journal"}
      subtitle={number ? undefined : "Number not assigned yet"}
      listHref="/journals"
      viewHref={viewHref}
      editHref={canEditDraft ? `${viewHref}/edit` : undefined}
      canUpdate={canEditDraft}
      mode={mode}
      badges={
        <>
          <DocumentStatusBadge
            status={journal.status}
            labels={JOURNAL_STATUS_LABELS}
            variants={JOURNAL_STATUS_VARIANTS}
          />
          <Badge variant="outline">{JOURNAL_TYPE_LABELS[journal.journal_type]}</Badge>
        </>
      }
      workflow={
        <DocumentWorkflowButtons
          availableActions={journal.available_actions}
          registry={JOURNAL_ACTION_REGISTRY}
          documentKind="journal"
          documentLabel={number ?? "journal"}
          disabledActions={{ post: !balanced }}
          extra={<StockWriteAlert periodLocked={journal.period_locked} error={writeError} />}
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
      formTitle={isEdit ? "Edit journal" : "Journal"}
      attachments={
        <EntityAttachmentsPanel
          entityType="JOURNAL_ENTRY"
          entityId={journal.id}
          parentPosted={journal.is_posted}
        />
      }
      activity={
        <ActivityFeed entityType="journal_entry" entityId={journal.id} revision={journal.version} />
      }
    >
      <JournalForm
        journal={journal}
        disabled={!isEdit}
        onSuccess={() => router.push(viewHref)}
      />
    </DocumentRecordShell>
  );
}
