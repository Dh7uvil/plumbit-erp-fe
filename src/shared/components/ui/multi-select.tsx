"use client";

import * as React from "react";
import { ChevronDownIcon } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { cn } from "@/shared/lib/cn";

export type MultiSelectOption = {
  value: string;
  label: string;
};

export function MultiSelect({
  options,
  value,
  onValueChange,
  placeholder = "Select…",
  emptyText = "No options available.",
  showSelectedSummary = true,
  className,
  disabled,
  ...props
}: Omit<React.ComponentProps<"button">, "value" | "onChange"> & {
  options: MultiSelectOption[];
  value: string[];
  onValueChange: (value: string[]) => void;
  placeholder?: string;
  emptyText?: string;
  showSelectedSummary?: boolean;
}) {
  const selectedLabels = options
    .filter((option) => value.includes(option.value))
    .map((option) => option.label);
  const summary =
    showSelectedSummary && selectedLabels.length > 0 ? selectedLabels.join(", ") : placeholder;

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          data-slot="multi-select-trigger"
          data-placeholder={summary === placeholder ? "" : undefined}
          className={cn(
            "border-input data-[placeholder]:text-muted-foreground [&_svg:not([class*='text-'])]:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 dark:hover:bg-input/50 bg-input-background flex h-9 w-full items-center justify-between gap-2 rounded-md border px-3 py-2 text-left text-sm transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
            className,
          )}
          {...props}
        >
          <span className="min-w-0 flex-1 truncate">{summary}</span>
          <ChevronDownIcon className="size-4 shrink-0 opacity-50" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="max-h-60 w-(--radix-dropdown-menu-trigger-width)"
      >
        {options.length === 0 ? (
          <p className="text-muted-foreground px-2 py-1.5 text-xs">{emptyText}</p>
        ) : (
          options.map((option) => {
            const checked = value.includes(option.value);
            return (
              <DropdownMenuCheckboxItem
                key={option.value}
                checked={checked}
                onSelect={(event) => event.preventDefault()}
                onCheckedChange={(nextChecked) => {
                  onValueChange(
                    nextChecked
                      ? [...value, option.value]
                      : value.filter((selected) => selected !== option.value),
                  );
                }}
              >
                {option.label}
              </DropdownMenuCheckboxItem>
            );
          })
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
