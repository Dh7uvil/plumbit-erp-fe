"use client";

import { ArrowUpDown } from "lucide-react";
import { useId, useState } from "react";

import { FilterField } from "@/shared/components/data-table/more-filters-dialog";
import { FilterSelect } from "@/shared/components/data-table/filter-select";
import type { SortFieldOption, SortPatch } from "@/shared/components/data-table/sort";
import { ToolbarControl, toolbarSortButtonClass } from "@/shared/components/data-table/toolbar";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import type { SortOrder } from "@/shared/hooks/use-table-params";

const ALL = "all";

export function SortDialog({
  fields,
  sortBy,
  sortOrder,
  onApply,
}: {
  fields: readonly SortFieldOption[];
  sortBy?: string;
  sortOrder?: SortOrder;
  onApply: (next: SortPatch) => void;
}) {
  const triggerId = useId();
  const [open, setOpen] = useState(false);
  const [draftField, setDraftField] = useState(ALL);
  const [draftOrder, setDraftOrder] = useState<SortOrder>("asc");
  const active = Boolean(sortBy);
  const activeLabel = fields.find((field) => field.value === sortBy)?.label ?? "Default";

  function handleOpenChange(next: boolean) {
    if (next) {
      setDraftField(sortBy && fields.some((field) => field.value === sortBy) ? sortBy : ALL);
      setDraftOrder(sortOrder === "desc" ? "desc" : "asc");
    }
    setOpen(next);
  }

  function apply() {
    if (draftField === ALL) {
      onApply({ sort_by: null, sort_order: null });
    } else {
      onApply({ sort_by: draftField, sort_order: draftOrder });
    }
    setOpen(false);
  }

  function clearSort() {
    onApply({ sort_by: null, sort_order: null });
    setOpen(false);
  }

  return (
    <>
      <ToolbarControl label="Sort" htmlFor={triggerId}>
        <Button
          id={triggerId}
          type="button"
          variant="default"
          size="sm"
          className={toolbarSortButtonClass(active)}
          onClick={() => handleOpenChange(true)}
        >
          <ArrowUpDown className="size-3.5" />
          {activeLabel}
          {active ? (
            <Badge className="h-5 min-w-5 border-transparent bg-white px-1 text-primary">1</Badge>
          ) : null}
        </Button>
      </ToolbarControl>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Sort</DialogTitle>
            <DialogDescription>Choose a column and sort order.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <FilterField label="Sort by" htmlFor="list-sort-field">
              <FilterSelect
                id="list-sort-field"
                className="w-full"
                placeholder="Sort by"
                value={draftField}
                onValueChange={setDraftField}
                options={[
                  { value: ALL, label: "Default" },
                  ...fields.map((field) => ({ value: field.value, label: field.label })),
                ]}
              />
            </FilterField>
            <FilterField label="Order" htmlFor="list-sort-order">
              <FilterSelect
                id="list-sort-order"
                className="w-full"
                placeholder="Order"
                value={draftOrder}
                onValueChange={(value) => setDraftOrder(value === "desc" ? "desc" : "asc")}
                options={[
                  { value: "asc", label: "Ascending" },
                  { value: "desc", label: "Descending" },
                ]}
              />
            </FilterField>
          </div>
          <DialogFooter className="gap-2 sm:justify-between">
            {active ? (
              <Button type="button" variant="ghost" onClick={clearSort}>
                Clear sort
              </Button>
            ) : (
              <span />
            )}
            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="button" onClick={apply}>
                Apply
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
