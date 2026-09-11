"use client";

import { useId } from "react";

import {
  SearchableSelect,
  type SearchableSelectOption,
} from "@/shared/components/form/searchable-select";
import { Label } from "@/shared/components/ui/label";

export function ConversionSourceSelect({
  label,
  options,
  value,
  onValueChange,
  onSearch,
  loading,
  placeholder,
  searchPlaceholder,
  emptyText,
}: {
  label: string;
  options: SearchableSelectOption[];
  value: string;
  onValueChange: (value: string) => void;
  onSearch: (query: string) => void;
  loading?: boolean;
  placeholder: string;
  searchPlaceholder?: string;
  emptyText?: string;
}) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <SearchableSelect
        id={id}
        asFormControl={false}
        aria-label={label}
        options={options}
        value={value}
        onValueChange={onValueChange}
        onQueryChange={onSearch}
        loading={loading}
        placeholder={placeholder}
        searchPlaceholder={searchPlaceholder ?? `Search ${label.toLowerCase()}…`}
        emptyText={emptyText ?? (loading ? "Searching…" : "No matches.")}
      />
    </div>
  );
}
