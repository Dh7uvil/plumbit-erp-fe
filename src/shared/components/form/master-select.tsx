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
}) {
  const actions =
    createActions ??
    (onCreate && createLabel ? [{ label: createLabel, onSelect: onCreate }] : []);
  const canCreate = !disabled && actions.length > 0;

  return (
    <div className={cn("flex items-start gap-1", className)}>
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
        />
      </div>
      {canCreate && !compact ? (
        actions.length === 1 ? (
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-9 shrink-0"
            aria-label={actions[0].label}
            onClick={actions[0].onSelect}
          >
            <Plus className="size-4" />
          </Button>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-9 shrink-0"
                aria-label="Create"
              >
                <Plus className="size-4" />
              </Button>
            </DropdownMenuTrigger>
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
