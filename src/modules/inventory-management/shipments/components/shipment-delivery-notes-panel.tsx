"use client";

import { toast } from "sonner";

import { useDeliveryNotes } from "@/modules/inventory-management/delivery-notes/queries";
import {
  STOCK_DOCUMENT_STATUS_LABELS,
  STOCK_DOCUMENT_STATUS_VARIANTS,
  deliveryNoteDisplayNumber,
} from "@/modules/inventory-management/delivery-notes/schemas";
import { deliveryNotePermissions } from "@/modules/inventory-management/delivery-notes/permissions";
import {
  useAttachDeliveryNotesToShipment,
  useDetachDeliveryNoteFromShipment,
} from "@/modules/inventory-management/shipments/mutations";
import { getErrorMessage } from "@/shared/api/errors";
import { RecordLink } from "@/shared/components/data-table/record-link";
import { DocumentStatusBadge } from "@/shared/components/document/document-status-badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { useCan } from "@/shared/providers/session-provider";

export function ShipmentDeliveryNotesPanel({
  shipmentId,
  canEdit,
}: {
  shipmentId: string;
  canEdit: boolean;
}) {
  const can = useCan();
  const canReadNotes = can(deliveryNotePermissions.read);
  const attachedQuery = useDeliveryNotes(
    { shipment_id: shipmentId, page_size: 100 },
    canReadNotes,
  );
  const unshippedQuery = useDeliveryNotes(
    { unshipped: true, status: "POSTED", page_size: 100 },
    canReadNotes && canEdit,
  );
  const attach = useAttachDeliveryNotesToShipment();
  const detach = useDetachDeliveryNoteFromShipment();
  const attached = attachedQuery.data?.data ?? [];
  const available = unshippedQuery.data?.data ?? [];

  if (!canReadNotes) {
    return null;
  }

  async function onAttach(noteId: string) {
    try {
      await attach.mutateAsync({ id: shipmentId, deliveryNoteIds: [noteId] });
      toast.success("Delivery note attached");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  async function onDetach(noteId: string) {
    try {
      await detach.mutateAsync({ id: shipmentId, noteId });
      toast.success("Delivery note detached");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Delivery notes</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="text-muted-foreground text-sm">
          Only posted, unshipped delivery notes can join a shipment. Attaching does not move stock.
        </p>
        <div>
          <p className="mb-1 text-sm font-medium">Attached</p>
          {attached.length === 0 ? (
            <p className="text-muted-foreground text-sm">No delivery notes on this shipment.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {attached.map((note) => (
                <li key={note.id} className="flex flex-wrap items-center gap-2 text-sm">
                  <RecordLink href={`/delivery-notes/${note.id}`}>
                    {deliveryNoteDisplayNumber(note) ?? "Delivery note"}
                  </RecordLink>
                  <DocumentStatusBadge
                    status={note.status}
                    labels={STOCK_DOCUMENT_STATUS_LABELS}
                    variants={STOCK_DOCUMENT_STATUS_VARIANTS}
                  />
                  {canEdit ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => void onDetach(note.id)}
                      disabled={detach.isPending}
                    >
                      Detach
                    </Button>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>
        {canEdit && available.length > 0 ? (
          <div>
            <p className="mb-1 text-sm font-medium">Posted and unshipped</p>
            <ul className="flex flex-col gap-2">
              {available.map((note) => (
                <li key={note.id} className="flex flex-wrap items-center gap-2 text-sm">
                  <RecordLink href={`/delivery-notes/${note.id}`}>
                    {deliveryNoteDisplayNumber(note) ?? "Delivery note"}
                  </RecordLink>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => void onAttach(note.id)}
                    disabled={attach.isPending}
                  >
                    Attach
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
