"use client";

import { FilterField } from "@/shared/components/data-table/more-filters-dialog";
import { toolbarLabelClass } from "@/shared/components/data-table/toolbar";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { cn } from "@/shared/lib/cn";

export function DateRangeFilter({
  from,
  to,
  onFromChange,
  onToChange,
  fromId,
  toId,
  fromLabel = "From date",
  toLabel = "To date",
  disabled = false,
  layout = "stacked",
  className,
}: {
  from: string;
  to: string;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
  fromId?: string;
  toId?: string;
  fromLabel?: string;
  toLabel?: string;
  disabled?: boolean;
  layout?: "stacked" | "inline";
  className?: string;
}) {
  if (layout === "inline") {
    return (
      <div className={cn("flex flex-wrap items-end gap-2", className)}>
        <div className="flex flex-col gap-1">
          <Label htmlFor={fromId} className={toolbarLabelClass}>
            {fromLabel}
          </Label>
          <Input
            id={fromId}
            type="date"
            className="w-40"
            value={from}
            disabled={disabled}
            aria-label={fromLabel}
            onChange={(event) => onFromChange(event.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor={toId} className={toolbarLabelClass}>
            {toLabel}
          </Label>
          <Input
            id={toId}
            type="date"
            className="w-40"
            value={to}
            disabled={disabled}
            min={from || undefined}
            aria-label={toLabel}
            onChange={(event) => onToChange(event.target.value)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={cn("col-span-full grid grid-cols-1 gap-3 sm:grid-cols-2", className)}>
      <FilterField label={fromLabel} htmlFor={fromId}>
        <Input
          id={fromId}
          type="date"
          value={from}
          disabled={disabled}
          onChange={(event) => onFromChange(event.target.value)}
        />
      </FilterField>
      <FilterField label={toLabel} htmlFor={toId}>
        <Input
          id={toId}
          type="date"
          value={to}
          disabled={disabled}
          min={from || undefined}
          onChange={(event) => onToChange(event.target.value)}
        />
      </FilterField>
    </div>
  );
}
