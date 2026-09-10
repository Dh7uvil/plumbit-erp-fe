"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { OPTIONAL_SELECT_NONE } from "@/config/constants";
import { SupplierFormDialog } from "@/modules/erp/suppliers/components/supplier-form-dialog";
import { supplierPermissions } from "@/modules/erp/suppliers/permissions";
import { useAllSuppliers } from "@/modules/erp/suppliers/queries";
import {
  useCreateShipment,
  useUpdateShipment,
} from "@/modules/inventory-management/shipments/mutations";
import {
  INCOTERM_LABELS,
  INCOTERMS,
  SHIPMENT_TYPE_LABELS,
  SHIPMENT_TYPES,
  ShipmentFormSchema,
  TRANSPORT_MODE_LABELS,
  TRANSPORT_MODES,
  optionalSelect,
  type Shipment,
  type ShipmentCreateRequest,
  type ShipmentFormValues,
  type ShipmentUpdateRequest,
} from "@/modules/inventory-management/shipments/schemas";
import { emptyToNull } from "@/modules/users-management/tenants/schemas";
import { getErrorMessage } from "@/shared/api/errors";
import { MasterSelect } from "@/shared/components/form/master-select";
import { Button } from "@/shared/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/components/ui/form";
import { Input } from "@/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Textarea } from "@/shared/components/ui/textarea";
import { applyFieldErrors } from "@/shared/lib/form-errors";
import { useDirtyFormGuard } from "@/shared/hooks/use-dirty-form-guard";
import { useCan } from "@/shared/providers/session-provider";

function optionalInt(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  const parsed = Number(trimmed);
  return Number.isInteger(parsed) ? parsed : null;
}

function toFormValues(shipment: Shipment | null): ShipmentFormValues {
  return {
    shipment_type: shipment?.shipment_type ?? "DOMESTIC",
    transport_mode: shipment?.transport_mode ?? "ROAD",
    incoterm: shipment?.incoterm ?? OPTIONAL_SELECT_NONE,
    container_number: shipment?.container_number ?? "",
    seal_number: shipment?.seal_number ?? "",
    carrier_name: shipment?.carrier_name ?? "",
    vessel_or_flight_no: shipment?.vessel_or_flight_no ?? "",
    voyage_number: shipment?.voyage_number ?? "",
    bl_awb_number: shipment?.bl_awb_number ?? "",
    bl_awb_date: shipment?.bl_awb_date ?? "",
    freight_forwarder_id: shipment?.freight_forwarder_id ?? OPTIONAL_SELECT_NONE,
    port_of_loading: shipment?.port_of_loading ?? "",
    port_of_discharge: shipment?.port_of_discharge ?? "",
    etd: shipment?.etd ?? "",
    eta: shipment?.eta ?? "",
    gross_weight: shipment?.gross_weight ?? "",
    net_weight: shipment?.net_weight ?? "",
    total_packages: shipment?.total_packages != null ? String(shipment.total_packages) : "",
    notes: shipment?.notes ?? "",
  };
}

function toPayload(values: ShipmentFormValues): ShipmentCreateRequest {
  return {
    shipment_type: values.shipment_type,
    transport_mode: values.transport_mode,
    incoterm: optionalSelect(values.incoterm) as ShipmentCreateRequest["incoterm"],
    container_number: emptyToNull(values.container_number),
    seal_number: emptyToNull(values.seal_number),
    carrier_name: emptyToNull(values.carrier_name),
    vessel_or_flight_no: emptyToNull(values.vessel_or_flight_no),
    voyage_number: emptyToNull(values.voyage_number),
    bl_awb_number: emptyToNull(values.bl_awb_number),
    bl_awb_date: emptyToNull(values.bl_awb_date),
    freight_forwarder_id: optionalSelect(values.freight_forwarder_id),
    port_of_loading: emptyToNull(values.port_of_loading),
    port_of_discharge: emptyToNull(values.port_of_discharge),
    etd: emptyToNull(values.etd),
    eta: emptyToNull(values.eta),
    gross_weight: emptyToNull(values.gross_weight),
    net_weight: emptyToNull(values.net_weight),
    total_packages: optionalInt(values.total_packages),
    notes: emptyToNull(values.notes),
  };
}

export function ShipmentForm({
  shipment,
  disabled = false,
  onSuccess,
}: {
  shipment: Shipment | null;
  disabled?: boolean;
  onSuccess?: () => void;
}) {
  const can = useCan();
  const router = useRouter();
  const createShipment = useCreateShipment();
  const updateShipment = useUpdateShipment();
  const suppliersQuery = useAllSuppliers(can(supplierPermissions.read));
  const [creatingSupplier, setCreatingSupplier] = useState(false);
  const form = useForm<ShipmentFormValues>({
    resolver: zodResolver(ShipmentFormSchema),
    defaultValues: toFormValues(shipment),
  });
  const pending = createShipment.isPending || updateShipment.isPending;
  useDirtyFormGuard(!disabled && form.formState.isDirty);
  const suppliers = suppliersQuery.data ?? [];

  useEffect(() => {
    form.reset(toFormValues(shipment));
  }, [form, shipment]);

  async function onSubmit(values: ShipmentFormValues) {
    const payload = toPayload(values);
    try {
      if (shipment) {
        const update: ShipmentUpdateRequest = payload;
        await updateShipment.mutateAsync({
          id: shipment.id,
          values: update,
          version: shipment.version,
        });
        toast.success("Shipment saved");
        onSuccess?.();
      } else {
        const created = await createShipment.mutateAsync(payload);
        toast.success("Shipment created");
        router.push(`/shipments/${created.id}`);
      }
    } catch (error) {
      if (applyFieldErrors(error, form.setError)) {
        return;
      }
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <Form {...form}>
      <form className="flex flex-col gap-5" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="shipment_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Shipment type</FormLabel>
                <Select value={field.value} onValueChange={field.onChange} disabled={disabled}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {SHIPMENT_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {SHIPMENT_TYPE_LABELS[type]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="transport_mode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Transport mode</FormLabel>
                <Select value={field.value} onValueChange={field.onChange} disabled={disabled}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {TRANSPORT_MODES.map((mode) => (
                      <SelectItem key={mode} value={mode}>
                        {TRANSPORT_MODE_LABELS[mode]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="incoterm"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Incoterm</FormLabel>
                <Select value={field.value} onValueChange={field.onChange} disabled={disabled}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="None" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={OPTIONAL_SELECT_NONE}>None</SelectItem>
                    {INCOTERMS.map((term) => (
                      <SelectItem key={term} value={term}>
                        {INCOTERM_LABELS[term]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="freight_forwarder_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Freight forwarder</FormLabel>
                <MasterSelect
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={disabled || suppliersQuery.isLoading}
                  placeholder="None"
                  searchPlaceholder="Search supplier…"
                  createLabel="Create supplier"
                  onCreate={
                    can(supplierPermissions.create) ? () => setCreatingSupplier(true) : undefined
                  }
                  options={[
                    { value: OPTIONAL_SELECT_NONE, label: "None" },
                    ...suppliers.map((supplier) => ({
                      value: supplier.id,
                      label: supplier.name,
                    })),
                  ]}
                />
                <FormMessage />
              </FormItem>
            )}
          />
          {(
            [
              ["container_number", "Container number"],
              ["seal_number", "Seal number"],
              ["carrier_name", "Carrier"],
              ["vessel_or_flight_no", "Vessel / flight"],
              ["voyage_number", "Voyage"],
              ["bl_awb_number", "BL / AWB number"],
              ["port_of_loading", "Port of loading"],
              ["port_of_discharge", "Port of discharge"],
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
                    <Input disabled={disabled} {...field} />
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
                    <Input type="date" disabled={disabled} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}
          <FormField
            control={form.control}
            name="gross_weight"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Gross weight</FormLabel>
                <FormControl>
                  <Input inputMode="decimal" disabled={disabled} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="net_weight"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Net weight</FormLabel>
                <FormControl>
                  <Input inputMode="decimal" disabled={disabled} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="total_packages"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Total packages</FormLabel>
                <FormControl>
                  <Input inputMode="numeric" disabled={disabled} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea disabled={disabled} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {!disabled ? (
          <div className="flex justify-end">
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="size-4 animate-spin" /> : null}
              {shipment ? "Save Changes" : "Create shipment"}
            </Button>
          </div>
        ) : null}
      </form>
      <SupplierFormDialog
        open={creatingSupplier}
        nested
        supplier={null}
        onCreated={(entity) => form.setValue("freight_forwarder_id", entity.id)}
        onOpenChange={setCreatingSupplier}
      />
    </Form>
  );
}
