"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { DebitNoteForm } from "@/modules/erp/debit-notes/components/debit-note-form";
import { useDebitNoteWorkflow } from "@/modules/erp/debit-notes/hooks/use-debit-note-workflow";
import { debitNotePermissions } from "@/modules/erp/debit-notes/permissions";
import { useDebitNote } from "@/modules/erp/debit-notes/queries";
import {
  DEBIT_NOTE_REASON_LABELS,
  INVOICE_DOCUMENT_STATUS_LABELS,
  INVOICE_DOCUMENT_STATUS_VARIANTS,
  TAX_TREATMENT_LABELS,
  debitNoteDisplayNumber,
  type DebitNote,
} from "@/modules/erp/debit-notes/schemas";
import { DEBIT_NOTE_ACTION_REGISTRY } from "@/modules/erp/debit-notes/workflow";
import {
  StockWriteAlert,
  isStockWriteAlertError,
} from "@/modules/erp/period-lock/components/stock-write-alert";
import { ActivityFeed } from "@/modules/users-management/activity/components/activity-feed";
import { EntityAttachmentsPanel } from "@/modules/users-management/attachments/components/entity-attachments-panel";
import { useCrudPermissions } from "@/shared/auth/use-crud-permissions";
import { AppliedCommercialTerms } from "@/shared/components/document/applied-commercial-terms";
import { DocumentLedgerCard } from "@/shared/components/document/document-ledger-card";
import { DocumentRecordShell } from "@/shared/components/document/document-record-shell";
import { DocumentStatusBadge } from "@/shared/components/document/document-status-badge";
import { DocumentWorkflowButtons } from "@/shared/components/document/document-workflow-buttons";
import { RelatedDocumentsCard } from "@/shared/components/document/related-documents-card";
import type { RecordPageMode } from "@/shared/components/layout/record-page-header";

export function DebitNoteDetailScreen({
  noteId,
  mode,
}: {
  noteId: string;
  mode: RecordPageMode;
}) {
  const router = useRouter();
  const { canUpdate } = useCrudPermissions(debitNotePermissions);
  const noteQuery = useDebitNote(noteId);
  const note = noteQuery.data;
  const isDraft = note?.status === "DRAFT";
  const isEdit = mode === "edit";
  const viewHref = `/debit-notes/${noteId}`;
  const canEditDraft = Boolean(isDraft && canUpdate);

  useEffect(() => {
    if (isEdit && note && note.status !== "DRAFT") {
      router.replace(viewHref);
    }
  }, [isEdit, note, router, viewHref]);

  if (noteQuery.isLoading || noteQuery.isError || !note) {
    return (
      <DocumentRecordShell
        isLoading={noteQuery.isLoading}
        isError={noteQuery.isError || !note}
        error={noteQuery.error}
        notFoundMessage="Debit note not found"
        onRetry={() => noteQuery.refetch()}
        backHref="/debit-notes"
        backLabel="Back to debit notes"
        title="Debit note"
        listHref="/debit-notes"
        viewHref={viewHref}
        canUpdate={false}
        mode={mode}
        formTitle="Debit note"
      >
        {null}
      </DocumentRecordShell>
    );
  }

  return (
    <DebitNoteDetailLoaded
      note={note}
      mode={mode}
      canEditDraft={canEditDraft}
      viewHref={viewHref}
    />
  );
}

function DebitNoteDetailLoaded({
  note,
  mode,
  canEditDraft,
  viewHref,
}: {
  note: DebitNote;
  mode: RecordPageMode;
  canEditDraft: boolean;
  viewHref: string;
}) {
  const router = useRouter();
  const isEdit = mode === "edit";
  const number = debitNoteDisplayNumber(note);
  const onAction = useDebitNoteWorkflow(note);
  const [writeError, setWriteError] = useState<unknown>(null);

  return (
    <DocumentRecordShell
      isLoading={false}
      isError={false}
      notFoundMessage="Debit note not found"
      onRetry={() => undefined}
      backHref="/debit-notes"
      backLabel="Back to debit notes"
      title={number ?? "Debit note"}
      subtitle={number ? undefined : "Number not assigned yet"}
      listHref="/debit-notes"
      viewHref={viewHref}
      editHref={canEditDraft ? `${viewHref}/edit` : undefined}
      canUpdate={canEditDraft}
      mode={mode}
      badges={
        <DocumentStatusBadge
          status={note.status}
          labels={INVOICE_DOCUMENT_STATUS_LABELS}
          variants={INVOICE_DOCUMENT_STATUS_VARIANTS}
        />
      }
      workflow={
        <DocumentWorkflowButtons
          availableActions={note.available_actions}
          registry={DEBIT_NOTE_ACTION_REGISTRY}
          documentKind="debit note"
          documentLabel={number ?? "debit note"}
          extra={<StockWriteAlert error={writeError} />}
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
        <div className="flex flex-col gap-2">
          <AppliedCommercialTerms
            currencyId={note.currency_id}
            exchangeRate={note.exchange_rate}
            taxTreatmentLabel={TAX_TREATMENT_LABELS[note.tax_treatment]}
          />
          <p className="text-muted-foreground text-sm">
            {DEBIT_NOTE_REASON_LABELS[note.reason_code]} · Against{" "}
            <Link
              href={`/purchase-invoices/${note.purchase_invoice_id}`}
              className="text-foreground underline-offset-4 hover:underline"
            >
              purchase invoice
            </Link>
            . Stock will not move.
          </p>
        </div>
      }
      formTitle={isEdit ? "Edit debit note" : "Debit note"}
      panels={
        <>
          <RelatedDocumentsCard documents={note.related_documents} />
          <DocumentLedgerCard
            journalEntryId={note.journal_entry_id}
            reversalJournalEntryId={note.reversal_journal_entry_id}
          />
        </>
      }
      attachments={
        <EntityAttachmentsPanel
          entityType="DEBIT_NOTE"
          entityId={note.id}
          parentPosted={note.is_posted}
        />
      }
      activity={<ActivityFeed entityType="debit_note" entityId={note.id} revision={note.version} />}
    >
      <DebitNoteForm note={note} disabled={!isEdit} onSuccess={() => router.push(viewHref)} />
    </DocumentRecordShell>
  );
}
