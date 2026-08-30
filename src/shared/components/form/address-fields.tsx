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
import { Textarea } from "@/shared/components/ui/textarea";

const LINE_FIELDS = [
  { key: "address_line_1", label: "Address line 1" },
  { key: "address_line_2", label: "Address line 2" },
] as const;

const LOCALITY_FIELDS = [
  { key: "city", label: "City" },
  { key: "state", label: "State" },
  { key: "country", label: "Country" },
] as const;

const POSTAL_FIELDS = [
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
    <div className="col-span-full flex flex-col gap-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {LINE_FIELDS.map((field) => (
          <FormField
            key={field.key}
            control={control}
            name={`${name}.${field.key}` as FieldPath<TFieldValues>}
            render={({ field: input }) => (
              <FormItem>
                <FormLabel>{field.label}</FormLabel>
                <FormControl>
                  <Textarea rows={2} className="min-h-16" disabled={disabled} {...input} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {LOCALITY_FIELDS.map((field) => (
          <FormField
            key={field.key}
            control={control}
            name={`${name}.${field.key}` as FieldPath<TFieldValues>}
            render={({ field: input }) => (
              <FormItem>
                <FormLabel>{field.label}</FormLabel>
                <FormControl>
                  <Input disabled={disabled} {...input} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ))}
        {POSTAL_FIELDS.map((field) => (
          <FormField
            key={field.key}
            control={control}
            name={`${name}.${field.key}` as FieldPath<TFieldValues>}
            render={({ field: input }) => (
              <FormItem>
                <FormLabel>{field.label}</FormLabel>
                <FormControl>
                  <Input disabled={disabled} {...input} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ))}
      </div>
    </div>
  );
}
