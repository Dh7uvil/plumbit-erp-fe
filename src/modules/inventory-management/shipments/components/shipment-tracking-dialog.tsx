"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { useUpdateShipmentTracking } from "@/modules/inventory-management/shipments/mutations";
import {
  ShipmentTrackingFormSchema,
  type Shipment,
  type ShipmentTrackingFormValues,
} from "@/modules/inventory-management/shipments/schemas";
import { getErrorMessage } from "@/shared/api/errors";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/components/ui/form";
import { Input } from "@/shared/components/ui/input";
import { applyFieldErrors } from "@/shared/lib/form-errors";
import { emptyToNull } from "@/modules/users-management/tenants/schemas";

function toFormValues(shipment: Shipment): ShipmentTrackingFormValues {
  return {
    carrier_name: shipment.carrier_name ?? "",
    vessel_or_flight_no: shipment.vessel_or_flight_no ?? "",
    voyage_number: shipment.voyage_number ?? "",
    bl_awb_number: shipment.bl_awb_number ?? "",
    bl_awb_date: shipment.bl_awb_date ?? "",
    etd: shipment.etd ?? "",
    eta: shipment.eta ?? "",
    actual_departure_date: shipment.actual_departure_date ?? "",
    actual_arrival_date: shipment.actual_arrival_date ?? "",
  };
}

export function ShipmentTrackingDialog({
  shipment,
  open,
  onOpenChange,
}: {
  shipment: Shipment;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const updateTracking = useUpdateShipmentTracking();
  const form = useForm<ShipmentTrackingFormValues>({
    resolver: zodResolver(ShipmentTrackingFormSchema),
    defaultValues: toFormValues(shipment),
  });

  useEffect(() => {
    if (open) {
      form.reset(toFormValues(shipment));
    }
  }, [form, open, shipment]);

  async function onSubmit(values: ShipmentTrackingFormValues) {
    try {
      await updateTracking.mutateAsync({
        id: shipment.id,
        version: shipment.version,
        values: {
          carrier_name: emptyToNull(values.carrier_name),
          vessel_or_flight_no: emptyToNull(values.vessel_or_flight_no),
          voyage_number: emptyToNull(values.voyage_number),
          bl_awb_number: emptyToNull(values.bl_awb_number),
          bl_awb_date: emptyToNull(values.bl_awb_date),
          etd: emptyToNull(values.etd),
          eta: emptyToNull(values.eta),
          actual_departure_date: emptyToNull(values.actual_departure_date),
          actual_arrival_date: emptyToNull(values.actual_arrival_date),
        },
      });
      toast.success("Tracking updated");
      onOpenChange(false);
    } catch (error) {
      if (applyFieldErrors(error, form.setError)) {
        return;
      }
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Update tracking</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form className="flex flex-col gap-3" onSubmit={form.handleSubmit(onSubmit)}>
            <p className="text-muted-foreground text-sm">
              Tracking is logistics status only. Stock already moved on the delivery note.
            </p>
            {(
              [
                ["carrier_name", "Carrier"],
                ["vessel_or_flight_no", "Vessel / flight"],
                ["voyage_number", "Voyage"],
                ["bl_awb_number", "BL / AWB number"],
              ] as const
            ).map(([name, label]) => (
              <FormField
                key={name}
                control={form.control}
                name={name}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{label}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
            {(
              [
                ["bl_awb_date", "BL / AWB date"],
                ["etd", "ETD"],
                ["eta", "ETA"],
                ["actual_departure_date", "Actual departure"],
                ["actual_arrival_date", "Actual arrival"],
              ] as const
            ).map(([name, label]) => (
              <FormField
                key={name}
                control={form.control}
                name={name}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{label}</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
            <DialogFooter>
              <Button type="submit" disabled={updateTracking.isPending}>
                {updateTracking.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                Save tracking
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
