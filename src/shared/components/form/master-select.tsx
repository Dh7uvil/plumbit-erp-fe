"use client";

import { Plus } from "lucide-react";

import {
  SearchableSelect,
  type SearchableSelectCreateAction,
  type SearchableSelectOption,
} from "@/shared/components/form/searchable-select";
import { Button } from "@/shared/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/components/ui/tooltip";
import { cn } from "@/shared/lib/cn";

export type CreatedMaster = {
  id: string;
};

export function MasterSelect({
  options,
  value,
  onValueChange,
  disabled,
  placeholder,
  searchPlaceholder,
  emptyText,
  className,
  compact = false,
  createLabel,
  onCreate,
  createActions,
  asFormControl = true,
  "aria-label": ariaLabel,
  onQueryChange,
  loading,
}: {
  options: SearchableSelectOption[];
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  className?: string;
  compact?: boolean;
  createLabel?: string;
  onCreate?: () => void;
  createActions?: SearchableSelectCreateAction[];
  asFormControl?: boolean;
  "aria-label"?: string;
  onQueryChange?: (query: string) => void;
  loading?: boolean;
}) {
  const actions =
    createActions ?? (onCreate && createLabel ? [{ label: createLabel, onSelect: onCreate }] : []);
  const canCreate = !disabled && actions.length > 0;

  const createButtonSize = compact ? ("icon-sm" as const) : ("icon" as const);
  const createButtonClassName = compact ? "shrink-0" : "size-9 shrink-0";
  const plusIconClassName = compact ? "size-3.5" : "size-4";

  return (
    <div className={cn("flex w-full items-center gap-1", className)}>
      <div className="min-w-0 flex-1">
        <SearchableSelect
          options={options}
          value={value}
          onValueChange={onValueChange}
          disabled={disabled}
          placeholder={placeholder}
          searchPlaceholder={searchPlaceholder}
          emptyText={emptyText}
          createActions={canCreate ? actions : undefined}
          asFormControl={asFormControl}
          aria-label={ariaLabel}
          onQueryChange={onQueryChange}
          loading={loading}
        />
      </div>
      {canCreate ? (
        actions.length === 1 ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size={createButtonSize}
                className={createButtonClassName}
                aria-label={actions[0].label}
                onClick={actions[0].onSelect}
              >
                <Plus className={plusIconClassName} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{actions[0].label}</TooltipContent>
          </Tooltip>
        ) : (
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size={createButtonSize}
                    className={createButtonClassName}
                    aria-label="Create"
                  >
                    <Plus className={plusIconClassName} />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>Create</TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="end">
              {actions.map((action) => (
                <DropdownMenuItem key={action.label} onSelect={action.onSelect}>
                  {action.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      ) : null}
    </div>
  );
}
