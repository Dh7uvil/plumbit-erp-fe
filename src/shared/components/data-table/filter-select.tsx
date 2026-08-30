"use client";

import {
  SearchableSelect,
  type SearchableSelectOption,
} from "@/shared/components/form/searchable-select";

export type FilterSelectOption = SearchableSelectOption;

export function FilterSelect({
  options,
  value,
  onValueChange,
  disabled,
  placeholder = "Select…",
  className,
  id,
  "aria-label": ariaLabel,
}: {
  options: FilterSelectOption[];
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  id?: string;
  "aria-label"?: string;
}) {
  return (
    <SearchableSelect
      asFormControl={false}
      options={options}
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      placeholder={placeholder}
      className={className}
      id={id}
      aria-label={ariaLabel ?? placeholder}
    />
  );
}
