"use client";

import Link from "next/link";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { useAttachDeliveryNotesToShipment } from "@/modules/inventory-management/shipments/mutations";
import { useShipments } from "@/modules/inventory-management/shipments/queries";
import {
  SHIPMENT_STATUS_LABELS,
  shipmentDisplayNumber,
} from "@/modules/inventory-management/shipments/schemas";
import { getErrorMessage } from "@/shared/api/errors";
import { ListSearch } from "@/shared/components/data-table/list-search";
import { CONVERT_FROM_DIALOG_CLASSNAME } from "@/shared/components/document/convert-from-menu";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { formatDate } from "@/shared/lib/format";

const OPEN_SHIPMENT_STATUSES = ["DRAFT", "DISPATCHED", "IN_TRANSIT", "ARRIVED"] as const;

export function AddDeliveryNoteToShipmentDialog({
  deliveryNoteId,
  open,
  onOpenChange,
}: {
  deliveryNoteId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const attach = useAttachDeliveryNotesToShipment();
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const shipmentsQuery = useShipments(
    { page_size: 50, search: search || undefined },
    open,
  );
  const shipments =
    shipmentsQuery.data?.data.filter((row) =>
      OPEN_SHIPMENT_STATUSES.includes(row.status as (typeof OPEN_SHIPMENT_STATUSES)[number]),
    ) ?? [];

  async function onSubmit() {
    if (!selectedId) {
      toast.error("Select a shipment.");
      return;
    }
    try {
      await attach.mutateAsync({ id: selectedId, deliveryNoteIds: [deliveryNoteId] });
      toast.success("Delivery note added to shipment");
      onOpenChange(false);
      router.push(`/shipments/${selectedId}`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={CONVERT_FROM_DIALOG_CLASSNAME}>
        <DialogHeader>
          <DialogTitle>Add to shipment</DialogTitle>
          <DialogDescription>
            Pick an open shipment. Only posted, unshipped delivery notes can be attached.
          </DialogDescription>
        </DialogHeader>
        <ListSearch value={search} onChange={setSearch} placeholder="Search shipments…" />
        <div className="max-h-64 overflow-y-auto rounded-md border">
          {shipmentsQuery.isLoading ? (
            <div className="text-muted-foreground flex items-center justify-center gap-2 p-6 text-sm">
              <Loader2 className="size-4 animate-spin" />
              Loading shipments…
            </div>
          ) : shipments.length === 0 ? (
            <div className="text-muted-foreground flex flex-col gap-2 p-4 text-sm">
              <p>No open shipments found.</p>
              <Link
                href="/shipments/new"
                className="text-foreground underline-offset-4 hover:underline"
              >
                Create shipment
              </Link>
            </div>
          ) : (
            <ul className="divide-y">
              {shipments.map((shipment) => {
                const label = shipmentDisplayNumber(shipment) ?? "Shipment";
                const selected = selectedId === shipment.id;
                return (
                  <li key={shipment.id}>
                    <button
                      type="button"
                      className={`hover:bg-muted/50 flex w-full flex-col gap-0.5 px-4 py-3 text-left text-sm ${
                        selected ? "bg-muted" : ""
                      }`}
                      onClick={() => setSelectedId(shipment.id)}
                    >
                      <span className="font-medium">{label}</span>
                      <span className="text-muted-foreground">
                        {SHIPMENT_STATUS_LABELS[shipment.status]} ·{" "}
                        {formatDate(shipment.etd ?? shipment.created_at)}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        <DialogFooter className="sm:justify-between">
          <Link
            href="/shipments/new"
            className="text-muted-foreground hover:text-foreground text-sm underline-offset-4 hover:underline"
          >
            Create shipment
          </Link>
          <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={() => void onSubmit()} disabled={attach.isPending}>
            {attach.isPending ? <Loader2 className="size-4 animate-spin" /> : "Add to shipment"}
          </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
