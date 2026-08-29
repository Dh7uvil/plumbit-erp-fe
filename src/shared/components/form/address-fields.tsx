"use client";

import type { Control, FieldPath, FieldValues } from "react-hook-form";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/components/ui/form";
import { Input } from "@/shared/components/ui/input";

const FIELDS = [
  { key: "address_line_1", label: "Address line 1", className: "sm:col-span-2" },
  { key: "address_line_2", label: "Address line 2", className: "sm:col-span-2" },
  { key: "city", label: "City" },
  { key: "state", label: "State" },
  { key: "country", label: "Country" },
  { key: "country_code", label: "Country code" },
  { key: "postal_code", label: "Postal code" },
] as const;

export function AddressFields<TFieldValues extends FieldValues>({
  control,
  name,
  disabled,
}: {
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>;
  disabled?: boolean;
}) {
  return (
    <>
      {FIELDS.map((field) => (
        <FormField
          key={field.key}
          control={control}
          name={`${name}.${field.key}` as FieldPath<TFieldValues>}
          render={({ field: input }) => (
            <FormItem className={"className" in field ? field.className : undefined}>
              <FormLabel>{field.label}</FormLabel>
              <FormControl>
                <Input disabled={disabled} {...input} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      ))}
    </>
  );
}
