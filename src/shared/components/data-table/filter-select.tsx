"use client";

import {
  SearchableSelect,
  type SearchableSelectOption,
} from "@/shared/components/form/searchable-select";
import { Label } from "@/shared/components/ui/label";
import { cn } from "@/shared/lib/cn";

export type FilterSelectOption = SearchableSelectOption;

export function FilterSelect({
  options,
  value,
  onValueChange,
  disabled,
  placeholder = "Select…",
  className,
  id,
  label,
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
  "aria-label"?: string;
}) {
  const select = (
    <SearchableSelect
      asFormControl={false}
      options={options}
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      placeholder={placeholder}
      className={label ? undefined : className}
      id={id}
      aria-label={ariaLabel ?? label ?? placeholder}
    />
  );

  if (!label) {
    return select;
  }

  return (
    <div className={cn("flex min-w-0 flex-col gap-1", className)}>
      <Label htmlFor={id} className="text-muted-foreground text-xs font-medium">
        {label}
      </Label>
      {select}
    </div>
  );
}
