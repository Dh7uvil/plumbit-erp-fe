"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  useArriveShipment,
  useCancelShipment,
  useCloseShipment,
  useDeleteShipment,
  useDispatchShipment,
} from "@/modules/inventory-management/shipments/mutations";
import type { Shipment } from "@/modules/inventory-management/shipments/schemas";
import type { ShipmentWorkflowAction } from "@/modules/inventory-management/shipments/workflow";

export function useShipmentWorkflow(
  shipment: Shipment,
  extras: { onTracking?: () => void } = {},
) {
  const router = useRouter();
  const dispatchShipment = useDispatchShipment();
  const arriveShipment = useArriveShipment();
  const closeShipment = useCloseShipment();
  const cancelShipment = useCancelShipment();
  const deleteShipment = useDeleteShipment();
  const write = { id: shipment.id, version: shipment.version };

  return async function onAction(action: ShipmentWorkflowAction) {
    if (action === "dispatch") {
      await dispatchShipment.mutateAsync(write);
      toast.success("Shipment dispatched");
    } else if (action === "arrive") {
      await arriveShipment.mutateAsync(write);
      toast.success("Shipment arrived");
    } else if (action === "close") {
      await closeShipment.mutateAsync(write);
      toast.success("Shipment closed");
    } else if (action === "cancel") {
      await cancelShipment.mutateAsync(write);
      toast.success("Shipment cancelled");
    } else if (action === "delete") {
      await deleteShipment.mutateAsync(write);
      toast.success("Shipment deleted");
      router.push("/shipments");
    } else if (action === "tracking") {
      extras.onTracking?.();
    }
  };
}
