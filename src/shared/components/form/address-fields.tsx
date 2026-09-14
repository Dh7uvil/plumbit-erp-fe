"use client";

import { useMemo } from "react";
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
import {
  countryCodeForName,
  countryNameForCode,
  isoCountryOptions,
} from "@/shared/lib/countries";
import {
  SearchableSelect,
} from "@/shared/components/form/searchable-select";

const LINE_FIELDS = [
  { key: "address_line_1", label: "Address line 1" },
  { key: "address_line_2", label: "Address line 2" },
] as const;

const LOCALITY_FIELDS = [
  { key: "city", label: "City" },
  { key: "state", label: "State" },
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
  const countries = useMemo(() => isoCountryOptions(), []);
  const countryOptions = useMemo(
    () => countries.map((country) => ({ value: country.code, label: country.name })),
    [countries],
  );

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
        <FormField
          control={control}
          name={`${name}.country` as FieldPath<TFieldValues>}
          render={({ field: countryField }) => (
            <FormField
              control={control}
              name={`${name}.country_code` as FieldPath<TFieldValues>}
              render={({ field: codeField }) => {
                const rawCode = String(codeField.value ?? "").trim();
                const selectedName = String(countryField.value ?? "").trim();
                const isoFromCode = countryOptions.some((option) => option.value === rawCode)
                  ? rawCode
                  : "";
                const selectedCode =
                  isoFromCode || countryCodeForName(selectedName, countries) || "";
                const options =
                  selectedName && !countryOptions.some((option) => option.value === selectedCode)
                    ? [{ value: selectedName, label: selectedName }, ...countryOptions]
                    : countryOptions;
                return (
                  <FormItem>
                    <FormLabel>Country</FormLabel>
                    <SearchableSelect
                      options={options}
                      value={selectedCode || selectedName}
                      onValueChange={(value) => {
                        const match = countries.find((country) => country.code === value);
                        if (match) {
                          countryField.onChange(match.name);
                          codeField.onChange(match.code);
                          return;
                        }
                        countryField.onChange(value);
                        codeField.onChange(countryNameForCode(value) ? value : "");
                      }}
                      disabled={disabled}
                      placeholder="Select country"
                    />
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
          )}
        />
        <FormField
          control={control}
          name={`${name}.postal_code` as FieldPath<TFieldValues>}
          render={({ field: input }) => (
            <FormItem>
              <FormLabel>Postal code</FormLabel>
              <FormControl>
                <Input disabled={disabled} {...input} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}