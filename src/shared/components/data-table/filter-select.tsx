"use client";

import { createContext, useContext, useId, type ReactNode } from "react";

import { toolbarLabelClass } from "@/shared/components/data-table/toolbar";
import {
  SearchableSelect,
  type SearchableSelectOption,
} from "@/shared/components/form/searchable-select";
import { Label } from "@/shared/components/ui/label";
import { cn } from "@/shared/lib/cn";

export type FilterSelectOption = SearchableSelectOption;

const NestedFilterLabelContext = createContext(false);

export function NestedFilterLabel({ children }: { children: ReactNode }) {
  return (
    <NestedFilterLabelContext.Provider value={true}>{children}</NestedFilterLabelContext.Provider>
  );
}

export function FilterSelect({
  options,
  value,
  onValueChange,
  disabled,
  placeholder = "Select…",
  className,
  id,
  label,
  hideLabel = false,
  searchable,
  "aria-label": ariaLabel,
}: {
  options: FilterSelectOption[];
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  id?: string;
  label?: string;
  hideLabel?: boolean;
  searchable?: boolean;
  "aria-label"?: string;
}) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const nested = useContext(NestedFilterLabelContext);
  const visibleLabel = hideLabel || nested ? undefined : (label ?? placeholder);
  const select = (
    <SearchableSelect
      asFormControl={false}
      options={options}
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      placeholder={placeholder}
      className={visibleLabel ? undefined : className}
      id={selectId}
      aria-label={ariaLabel ?? visibleLabel ?? label ?? placeholder}
      searchable={searchable}
    />
  );

  if (!visibleLabel) {
    return select;
  }

  return (
    <div className={cn("flex min-w-0 flex-col gap-1", className)}>
      <Label htmlFor={selectId} className={toolbarLabelClass}>
        {visibleLabel}
      </Label>
      {select}
    </div>
  );
}
