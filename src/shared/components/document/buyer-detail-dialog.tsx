"use client";

import type { Control, FieldValues, Path } from "react-hook-form";

import { OPTIONAL_SELECT_NONE } from "@/config/constants";
import {
  PLACE_OF_SUPPLY_LABELS,
  PLACES_OF_SUPPLY,
} from "@/modules/erp/sales-invoices/schemas";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/components/ui/form";
import { Input } from "@/shared/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";

type BuyerDetailDialogProps<T extends FieldValues> = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  control: Control<T>;
  disabled?: boolean;
  customerName: string | null;
  customerTrn: string | null;
  taxTreatmentLabel: string | null;
  supplyDateName: Path<T>;
  placeOfSupplyName: Path<T>;
};

export function BuyerDetailDialog<T extends FieldValues>({
  open,
  onOpenChange,
  control,
  disabled = false,
  customerName,
  customerTrn,
  taxTreatmentLabel,
  supplyDateName,
  placeOfSupplyName,
}: BuyerDetailDialogProps<T>) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Buyer details</DialogTitle>
          <DialogDescription>
            Delivery and tax context for this invoice (legacy Winsoft buyer sheet).
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <FormItem>
            <FormLabel>Customer</FormLabel>
            <Input value={customerName ?? "—"} disabled />
          </FormItem>
          <FormItem>
            <FormLabel>TRN</FormLabel>
            <Input value={customerTrn?.trim() || "—"} disabled />
          </FormItem>
          <FormItem>
            <FormLabel>Registration type</FormLabel>
            <Input value={taxTreatmentLabel?.trim() || "—"} disabled />
          </FormItem>
          <FormField
            control={control}
            name={supplyDateName}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Delivery / supply date</FormLabel>
                <FormControl>
                  <Input type="date" disabled={disabled} {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name={placeOfSupplyName}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Place of supply</FormLabel>
                <Select
                  value={String(field.value ?? OPTIONAL_SELECT_NONE)}
                  onValueChange={field.onChange}
                  disabled={disabled}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="None" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={OPTIONAL_SELECT_NONE}>None</SelectItem>
                    {PLACES_OF_SUPPLY.map((place) => (
                      <SelectItem key={place} value={place}>
                        {PLACE_OF_SUPPLY_LABELS[place]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
