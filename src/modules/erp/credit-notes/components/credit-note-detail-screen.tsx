"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { CreditNoteForm } from "@/modules/erp/credit-notes/components/credit-note-form";
import { useCreditNoteWorkflow } from "@/modules/erp/credit-notes/hooks/use-credit-note-workflow";
import { creditNotePermissions } from "@/modules/erp/credit-notes/permissions";
import { useCreditNote } from "@/modules/erp/credit-notes/queries";
import {
  CREDIT_NOTE_REASON_LABELS,
  INVOICE_DOCUMENT_STATUS_LABELS,
  INVOICE_DOCUMENT_STATUS_VARIANTS,
  TAX_TREATMENT_LABELS,
  creditNoteDisplayNumber,
  type CreditNote,
} from "@/modules/erp/credit-notes/schemas";
import { CREDIT_NOTE_ACTION_REGISTRY } from "@/modules/erp/credit-notes/workflow";
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
import { printHref } from "@/shared/lib/print";
import { DocumentStatusBadge } from "@/shared/components/document/document-status-badge";
import { DocumentWorkflowButtons } from "@/shared/components/document/document-workflow-buttons";
import { RelatedDocumentsCard } from "@/shared/components/document/related-documents-card";
import type { RecordPageMode } from "@/shared/components/layout/record-page-header";

export function CreditNoteDetailScreen({
  noteId,
  mode,
}: {
  noteId: string;
  mode: RecordPageMode;
}) {
  const router = useRouter();
  const { canUpdate } = useCrudPermissions(creditNotePermissions);
  const noteQuery = useCreditNote(noteId);
  const note = noteQuery.data;
  const isDraft = note?.status === "DRAFT";
  const isEdit = mode === "edit";
  const viewHref = `/credit-notes/${noteId}`;
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
        notFoundMessage="Credit note not found"
        onRetry={() => noteQuery.refetch()}
        backHref="/credit-notes"
        backLabel="Back to credit notes"
        title="Credit note"
        listHref="/credit-notes"
        viewHref={viewHref}
        canUpdate={false}
        mode={mode}
        formTitle="Credit note"
      >
        {null}
      </DocumentRecordShell>
    );
  }

  return (
    <CreditNoteDetailLoaded
      note={note}
      mode={mode}
      canEditDraft={canEditDraft}
      viewHref={viewHref}
    />
  );
}

function CreditNoteDetailLoaded({
  note,
  mode,
  canEditDraft,
  viewHref,
}: {
  note: CreditNote;
  mode: RecordPageMode;
  canEditDraft: boolean;
  viewHref: string;
}) {
  const router = useRouter();
  const isEdit = mode === "edit";
  const number = creditNoteDisplayNumber(note);
  const onAction = useCreditNoteWorkflow(note);
  const [writeError, setWriteError] = useState<unknown>(null);

  return (
    <DocumentRecordShell
      isLoading={false}
      isError={false}
      notFoundMessage="Credit note not found"
      onRetry={() => undefined}
      backHref="/credit-notes"
      backLabel="Back to credit notes"
      title={number ?? "Credit note"}
      subtitle={number ? undefined : "Number not assigned yet"}
      listHref="/credit-notes"
      viewHref={viewHref}
      printHref={printHref("credit-notes", note.id)}
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
          registry={CREDIT_NOTE_ACTION_REGISTRY}
          documentKind="credit note"
          documentLabel={number ?? "credit note"}
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
            {CREDIT_NOTE_REASON_LABELS[note.reason_code]}
            {note.sales_invoice_id ? (
              <>
                {" · "}
                Against{" "}
                <Link
                  href={`/sales-invoices/${note.sales_invoice_id}`}
                  className="text-foreground underline-offset-4 hover:underline"
                >
                  sales invoice
                </Link>
              </>
            ) : null}
            {note.sales_return_id ? (
              <>
                {" · "}
                <Link
                  href={`/sales-returns/${note.sales_return_id}`}
                  className="text-foreground underline-offset-4 hover:underline"
                >
                  sales return
                </Link>
              </>
            ) : null}
            . Stock will not move.
          </p>
        </div>
      }
      formTitle={isEdit ? "Edit credit note" : "Credit note"}
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
          entityType="CREDIT_NOTE"
          entityId={note.id}
          parentPosted={note.is_posted}
        />
      }
      activity={
        <ActivityFeed entityType="credit_note" entityId={note.id} revision={note.version} />
      }
    >
      <CreditNoteForm note={note} disabled={!isEdit} onSuccess={() => router.push(viewHref)} />
    </DocumentRecordShell>
  );
}
