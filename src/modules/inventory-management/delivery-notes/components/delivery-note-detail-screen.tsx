"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  StockWriteAlert,
  isStockWriteAlertError,
} from "@/modules/erp/period-lock/components/stock-write-alert";
import { AddDeliveryNoteToShipmentDialog } from "@/modules/inventory-management/delivery-notes/components/add-to-shipment-dialog";
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
import { CreateInvoiceFromDeliveryNotesDialog } from "@/modules/erp/sales-invoices/components/create-from-delivery-notes-dialog";
import { EntityAttachmentsPanel } from "@/modules/users-management/attachments/components/entity-attachments-panel";
import { useCrudPermissions } from "@/shared/auth/use-crud-permissions";
import { DocumentRecordShell } from "@/shared/components/document/document-record-shell";
import { printHref } from "@/shared/lib/print";
import { DocumentLedgerCard } from "@/shared/components/document/document-ledger-card";
import { DocumentStatusBadge } from "@/shared/components/document/document-status-badge";
import { DocumentWorkflowButtons } from "@/shared/components/document/document-workflow-buttons";
import { RelatedDocumentsCard } from "@/shared/components/document/related-documents-card";
import type { RecordPageMode } from "@/shared/components/layout/record-page-header";

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
  const isEdit = mode === "edit";
  const number = deliveryNoteDisplayNumber(note);
  const onAction = useDeliveryNoteWorkflow(note);
  const [writeError, setWriteError] = useState<unknown>(null);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [shipmentOpen, setShipmentOpen] = useState(false);
  const workflowActions = note.available_actions;

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
      printHref={printHref("delivery-notes", note.id)}
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
            if (action === "create_sales_invoice") {
              setInvoiceOpen(true);
              return;
            }
            if (action === "add_to_shipment") {
              setShipmentOpen(true);
              return;
            }
            await onAction(action, extras);
          }}
        />
      }
      banner={
        <p className="text-muted-foreground text-sm">
          {note.sales_order_id ? (
            <>
              Against{" "}
              <Link
                href={`/sales-orders/${note.sales_order_id}`}
                className="text-foreground underline-offset-4 hover:underline"
              >
                sales order
              </Link>
            </>
          ) : note.source_sales_invoice_id ? (
            <>
              Against{" "}
              <Link
                href={`/sales-invoices/${note.source_sales_invoice_id}`}
                className="text-foreground underline-offset-4 hover:underline"
              >
                sales invoice
              </Link>
            </>
          ) : (
            "No source document linked"
          )}
          {note.shipment_id ? (
            <>
              {" · "}
              <Link
                href={`/shipments/${note.shipment_id}`}
                className="text-foreground underline-offset-4 hover:underline"
              >
                Shipment
              </Link>
            </>
          ) : null}
          .
        </p>
      }
      formTitle={isEdit ? "Edit delivery note" : "Delivery note"}
      panels={
        <>
          <RelatedDocumentsCard documents={note.related_documents} />
          <DocumentLedgerCard journalEntryId={note.journal_entry_id} />
          {note.sales_order_id ? (
            <DeliveryNotePackagesPanel
              noteId={note.id}
              salesOrderId={note.sales_order_id}
              canEdit={note.status !== "CANCELLED"}
            />
          ) : null}
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
    >
      <DeliveryNoteForm note={note} disabled={!isEdit} onSuccess={() => router.push(viewHref)} />
      <CreateInvoiceFromDeliveryNotesDialog
        open={invoiceOpen}
        onOpenChange={setInvoiceOpen}
        customerId={note.customer_id}
        presetNoteIds={[note.id]}
      />
      <AddDeliveryNoteToShipmentDialog
        deliveryNoteId={note.id}
        open={shipmentOpen}
        onOpenChange={setShipmentOpen}
      />
    </DocumentRecordShell>
  );
}
