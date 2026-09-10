"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  StockWriteAlert,
  isStockWriteAlertError,
} from "@/modules/erp/period-lock/components/stock-write-alert";
import { DeliveryNoteForm } from "@/modules/inventory-management/delivery-notes/components/delivery-note-form";
import { DeliveryNotePackagesPanel } from "@/modules/inventory-management/delivery-notes/components/delivery-note-packages-panel";
import { useDeliveryNoteWorkflow } from "@/modules/inventory-management/delivery-notes/hooks/use-delivery-note-workflow";
import { deliveryNotePermissions } from "@/modules/inventory-management/delivery-notes/permissions";
import { useDeliveryNote } from "@/modules/inventory-management/delivery-notes/queries";
import {
  STOCK_DOCUMENT_STATUS_LABELS,
  STOCK_DOCUMENT_STATUS_VARIANTS,
  deliveryNoteDisplayNumber,
  type DeliveryNote,
} from "@/modules/inventory-management/delivery-notes/schemas";
import { DELIVERY_NOTE_ACTION_REGISTRY } from "@/modules/inventory-management/delivery-notes/workflow";
import { salesInvoicePermissions } from "@/modules/erp/sales-invoices/permissions";
import { CreateInvoiceFromDeliveryNotesDialog } from "@/modules/erp/sales-invoices/components/create-from-delivery-notes-dialog";
import { salesReturnPermissions } from "@/modules/inventory-management/sales-returns/permissions";
import { ActivityFeed } from "@/modules/users-management/activity/components/activity-feed";
import { EntityAttachmentsPanel } from "@/modules/users-management/attachments/components/entity-attachments-panel";
import { useCrudPermissions } from "@/shared/auth/use-crud-permissions";
import { DocumentRecordShell } from "@/shared/components/document/document-record-shell";
import { DocumentLedgerCard } from "@/shared/components/document/document-ledger-card";
import { DocumentStatusBadge } from "@/shared/components/document/document-status-badge";
import { DocumentWorkflowButtons } from "@/shared/components/document/document-workflow-buttons";
import type { RecordPageMode } from "@/shared/components/layout/record-page-header";
import { Button } from "@/shared/components/ui/button";
import { useCan } from "@/shared/providers/session-provider";

export function DeliveryNoteDetailScreen({
  noteId,
  mode,
}: {
  noteId: string;
  mode: RecordPageMode;
}) {
  const router = useRouter();
  const { canUpdate } = useCrudPermissions(deliveryNotePermissions);
  const noteQuery = useDeliveryNote(noteId);
  const note = noteQuery.data;
  const isDraft = note?.status === "DRAFT";
  const isEdit = mode === "edit";
  const viewHref = `/delivery-notes/${noteId}`;
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
        notFoundMessage="Delivery note not found"
        onRetry={() => noteQuery.refetch()}
        backHref="/delivery-notes"
        backLabel="Back to delivery notes"
        title="Delivery note"
        listHref="/delivery-notes"
        viewHref={viewHref}
        canUpdate={false}
        mode={mode}
        formTitle="Delivery note"
      >
        {null}
      </DocumentRecordShell>
    );
  }

  return (
    <DeliveryNoteDetailLoaded
      note={note}
      mode={mode}
      canEditDraft={canEditDraft}
      viewHref={viewHref}
    />
  );
}

function DeliveryNoteDetailLoaded({
  note,
  mode,
  canEditDraft,
  viewHref,
}: {
  note: DeliveryNote;
  mode: RecordPageMode;
  canEditDraft: boolean;
  viewHref: string;
}) {
  const router = useRouter();
  const can = useCan();
  const isEdit = mode === "edit";
  const number = deliveryNoteDisplayNumber(note);
  const onAction = useDeliveryNoteWorkflow(note);
  const [writeError, setWriteError] = useState<unknown>(null);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const canCreateInvoice = note.status === "POSTED" && can(salesInvoicePermissions.create);
  const workflowActions =
    note.is_posted &&
    can(salesReturnPermissions.create) &&
    !note.available_actions.includes("create_return")
      ? [...note.available_actions, "create_return"]
      : note.available_actions;

  return (
    <DocumentRecordShell
      isLoading={false}
      isError={false}
      notFoundMessage="Delivery note not found"
      onRetry={() => undefined}
      backHref="/delivery-notes"
      backLabel="Back to delivery notes"
      title={number ?? "Delivery note"}
      subtitle={number ? undefined : "Number not assigned yet"}
      listHref="/delivery-notes"
      viewHref={viewHref}
      editHref={canEditDraft ? `${viewHref}/edit` : undefined}
      canUpdate={canEditDraft}
      mode={mode}
      badges={
        <DocumentStatusBadge
          status={note.status}
          labels={STOCK_DOCUMENT_STATUS_LABELS}
          variants={STOCK_DOCUMENT_STATUS_VARIANTS}
        />
      }
      workflow={
        <div className="flex flex-col items-end gap-2">
          {canCreateInvoice ? (
            <Button type="button" size="sm" variant="outline" onClick={() => setInvoiceOpen(true)}>
              Create invoice
            </Button>
          ) : null}
          <DocumentWorkflowButtons
            availableActions={workflowActions}
            registry={DELIVERY_NOTE_ACTION_REGISTRY}
            documentKind="delivery note"
            documentLabel={number ?? "delivery note"}
            extra={<StockWriteAlert periodLocked={note.period_locked} error={writeError} />}
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
            href={`/sales-orders/${note.sales_order_id}`}
            className="text-foreground underline-offset-4 hover:underline"
          >
            sales order
          </Link>
          {note.shipment_id ? (
            <>
              {" "}
              · Shipment{" "}
              <Link
                href={`/shipments/${note.shipment_id}`}
                className="text-foreground underline-offset-4 hover:underline"
              >
                tracking
              </Link>
            </>
          ) : null}
          .
        </p>
      }
      formTitle={isEdit ? "Edit delivery note" : "Delivery note"}
      panels={
        <>
          <DocumentLedgerCard journalEntryId={note.journal_entry_id} />
          <DeliveryNotePackagesPanel
            noteId={note.id}
            salesOrderId={note.sales_order_id}
            canEdit={note.status !== "CANCELLED"}
          />
        </>
      }
      attachments={
        <EntityAttachmentsPanel
          entityType="DELIVERY_NOTE"
          entityId={note.id}
          parentPosted={note.is_posted}
          defaultCategory="POD"
        />
      }
      activity={
        <ActivityFeed entityType="delivery_note" entityId={note.id} revision={note.version} />
      }
    >
      <DeliveryNoteForm
        note={note}
        disabled={!isEdit}
        onSuccess={() => router.push(viewHref)}
      />
      <CreateInvoiceFromDeliveryNotesDialog
        open={invoiceOpen}
        onOpenChange={setInvoiceOpen}
        customerId={note.customer_id}
        presetNoteIds={[note.id]}
      />
    </DocumentRecordShell>
  );
}
