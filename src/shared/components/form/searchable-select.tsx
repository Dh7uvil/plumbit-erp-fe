"use client";

import { CheckIcon, ChevronDownIcon, Plus, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { FormControl } from "@/shared/components/ui/form";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { Input } from "@/shared/components/ui/input";
import { cn } from "@/shared/lib/cn";

export type SearchableSelectOption = {
  value: string;
  label: string;
};

export type SearchableSelectCreateAction = {
  label: string;
  onSelect: () => void;
};

export function SearchableSelect({
  options,
  value,
  onValueChange,
  disabled,
  placeholder = "Select…",
  searchPlaceholder = "Search…",
  emptyText = "No matches.",
  className,
  createActions,
  asFormControl = true,
  id,
  "aria-label": ariaLabel,
}: {
  options: SearchableSelectOption[];
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  className?: string;
  createActions?: SearchableSelectCreateAction[];
  asFormControl?: boolean;
  id?: string;
  "aria-label"?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const selected = options.find((option) => option.value === value);

  useEffect(() => {
    if (!open) {
      return;
    }
    const frame = window.requestAnimationFrame(() => {
      searchRef.current?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [open]);
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) {
      return options;
    }
    return options.filter(
      (option) =>
        option.label.toLowerCase().includes(needle) || option.value.toLowerCase().includes(needle),
    );
  }, [options, query]);

  const trigger = (
    <button
      type="button"
      disabled={disabled}
      id={id}
      aria-label={ariaLabel}
      data-slot="select-trigger"
      data-placeholder={selected ? undefined : ""}
      className={cn(
        "border-input data-[placeholder]:text-muted-foreground [&_svg:not([class*='text-'])]:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 dark:hover:bg-input/50 bg-input-background flex h-9 w-full cursor-pointer items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm whitespace-nowrap transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
    >
      <span className="min-w-0 flex-1 truncate text-left">{selected?.label ?? placeholder}</span>
      <ChevronDownIcon className="size-4 shrink-0 opacity-50" />
    </button>
  );

  return (
    <DropdownMenu
      modal={false}
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setQuery("");
        }
      }}
    >
      <DropdownMenuTrigger asChild>
        {asFormControl ? <FormControl>{trigger}</FormControl> : trigger}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-(--radix-dropdown-menu-trigger-width) overflow-hidden p-0"
        onCloseAutoFocus={(event) => event.preventDefault()}
      >
        <div className="p-1.5">
          <div className="relative">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2" />
            <Input
              ref={searchRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              autoComplete="off"
              autoFocus
              className="h-8 pl-8"
              onPointerDown={(event) => event.stopPropagation()}
              onKeyDown={(event) => {
                if (
                  event.key === "ArrowDown" ||
                  event.key === "ArrowUp" ||
                  event.key === "Enter" ||
                  event.key === "Escape" ||
                  event.key === "Home" ||
                  event.key === "End" ||
                  event.key === "Tab"
                ) {
                  return;
                }
                event.stopPropagation();
              }}
            />
          </div>
        </div>
        <div className="max-h-60 overflow-y-auto p-1">
          {filtered.length === 0 ? (
            <p className="text-muted-foreground px-2 py-1.5 text-sm">{emptyText}</p>
          ) : (
            filtered.map((option) => (
              <DropdownMenuItem
                key={option.value}
                onSelect={() => onValueChange(option.value)}
                className="justify-between gap-2"
              >
                <span className="min-w-0 truncate">{option.label}</span>
                {option.value === value ? <CheckIcon className="size-4 shrink-0" /> : null}
              </DropdownMenuItem>
            ))
          )}
        </div>
        {createActions && createActions.length > 0 ? (
          <>
            <DropdownMenuSeparator />
            <div className="p-1">
              {createActions.map((action) => (
                <DropdownMenuItem
                  key={action.label}
                  onSelect={() => {
                    setOpen(false);
                    action.onSelect();
                  }}
                >
                  <Plus className="size-4" />
                  {action.label}
                </DropdownMenuItem>
              ))}
            </div>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
