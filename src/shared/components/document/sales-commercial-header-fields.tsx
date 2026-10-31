"use client";

import type { Control, FieldPath, FieldValues } from "react-hook-form";

import { OPTIONAL_SELECT_NONE } from "@/config/constants";
import { PLACE_OF_SUPPLY_LABELS, PLACES_OF_SUPPLY } from "@/modules/erp/sales-orders/schemas";
import { EmployeeSelect } from "@/modules/users-management/employees/components/employee-select";
import {
  PAYMENT_MODE_LABELS,
  PAYMENT_MODES,
  PRICE_BASIS_LABELS,
  PRICE_BASIS_OPTIONS,
  registrationTypeLabel,
  SALES_TAX_TREATMENT_DISPLAY_LABELS,
} from "@/shared/lib/sales-document-labels";
import {
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

type SalesCommercialHeaderFieldsProps<T extends FieldValues> = {
  control: Control<T>;
  disabled?: boolean;
  taxTreatment: string;
  customerTrn: string;
  documentNumber?: string | null;
  documentNumberLabel?: string;
  dateField: FieldPath<T>;
  showDefaultPrice?: boolean;
  onSalesmanChange?: () => void;
  onPlaceOfSupplyChange?: () => void;
};

export function SalesCommercialHeaderFields<T extends FieldValues>({
  control,
  disabled = false,
  taxTreatment,
  customerTrn,
  documentNumber,
  documentNumberLabel = "Order no",
  dateField,
  showDefaultPrice = true,
  onSalesmanChange,
  onPlaceOfSupplyChange,
}: SalesCommercialHeaderFieldsProps<T>) {
  return (
    <>
      {documentNumber ? (
        <FormItem>
          <FormLabel>{documentNumberLabel}</FormLabel>
          <Input disabled readOnly className="bg-muted/40" value={documentNumber} />
        </FormItem>
      ) : null}
      <FormField
        control={control}
        name={"payment_mode" as FieldPath<T>}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Cash / Credit</FormLabel>
            <Select
              value={String(field.value || "CREDIT")}
              onValueChange={field.onChange}
              disabled={disabled}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {PAYMENT_MODES.map((mode) => (
                  <SelectItem key={mode} value={mode}>
                    {PAYMENT_MODE_LABELS[mode]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name={dateField}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Date</FormLabel>
            <FormControl>
              <Input type="date" disabled={disabled} {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name={"fiscal_period" as FieldPath<T>}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Period</FormLabel>
            <FormControl>
              <Input
                className="w-full min-w-0"
                disabled={disabled}
                placeholder="—"
                {...field}
                value={String(field.value ?? "")}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name={"account_code" as FieldPath<T>}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Account</FormLabel>
            <FormControl>
              <Input disabled readOnly className="bg-muted/40" {...field} />
            </FormControl>
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name={"account_name" as FieldPath<T>}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Name</FormLabel>
            <FormControl>
              <Input disabled readOnly className="bg-muted/40" {...field} />
            </FormControl>
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name={"notes" as FieldPath<T>}
        render={({ field }) => (
          <FormItem className="sm:col-span-2">
            <FormLabel>Description</FormLabel>
            <FormControl>
              <Input disabled={disabled} {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name={"reference_number" as FieldPath<T>}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Ref no</FormLabel>
            <FormControl>
              <Input disabled={disabled} {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name={"reference_date" as FieldPath<T>}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Ref date</FormLabel>
            <FormControl>
              <Input type="date" disabled={disabled} {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormItem>
        <FormLabel>Tax treatment</FormLabel>
        <Input
          disabled
          readOnly
          className="bg-muted/40"
          value={SALES_TAX_TREATMENT_DISPLAY_LABELS[taxTreatment] ?? taxTreatment}
        />
      </FormItem>
      {showDefaultPrice ? (
        <FormField
          control={control}
          name={"price_basis" as FieldPath<T>}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Default price</FormLabel>
              <Select
                value={String(field.value || "DEFAULT")}
                onValueChange={field.onChange}
                disabled={disabled}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {PRICE_BASIS_OPTIONS.map((basis) => (
                    <SelectItem key={basis} value={basis}>
                      {PRICE_BASIS_LABELS[basis]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      ) : null}
      <FormField
        control={control}
        name={"salesperson_id" as FieldPath<T>}
        render={({ field }) => (
          <EmployeeSelect
            value={String(field.value ?? OPTIONAL_SELECT_NONE)}
            onValueChange={(value) => {
              onSalesmanChange?.();
              field.onChange(value);
            }}
            disabled={disabled}
            label="Salesman"
          />
        )}
      />
      <FormField
        control={control}
        name={"place_of_supply" as FieldPath<T>}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Place of supply</FormLabel>
            <Select
              value={String(field.value ?? OPTIONAL_SELECT_NONE)}
              onValueChange={(value) => {
                onPlaceOfSupplyChange?.();
                field.onChange(value);
              }}
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
      <FormItem>
        <FormLabel>Reg type</FormLabel>
        <Input
          disabled
          readOnly
          className="bg-muted/40"
          value={registrationTypeLabel(taxTreatment)}
        />
      </FormItem>
      <FormItem>
        <FormLabel>TRN</FormLabel>
        <Input disabled readOnly className="bg-muted/40" value={customerTrn || "—"} />
      </FormItem>
    </>
  );
}
