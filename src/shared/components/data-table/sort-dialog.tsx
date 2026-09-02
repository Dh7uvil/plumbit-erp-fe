"use client";

import { ArrowUpDown } from "lucide-react";
import { useState } from "react";

import { FilterSelect } from "@/shared/components/data-table/filter-select";
import type { SortFieldOption, SortPatch } from "@/shared/components/data-table/sort";
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
import { Label } from "@/shared/components/ui/label";
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
  const [open, setOpen] = useState(false);
  const [draftField, setDraftField] = useState(ALL);
  const [draftOrder, setDraftOrder] = useState<SortOrder>("asc");
  const active = Boolean(sortBy);

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
      <Button type="button" variant="outline" size="sm" onClick={() => handleOpenChange(true)}>
        <ArrowUpDown className="size-3.5" />
        Sort
        {active ? (
          <Badge variant="secondary" className="h-5 min-w-5 px-1">
            1
          </Badge>
        ) : null}
      </Button>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Sort</DialogTitle>
            <DialogDescription>Choose a column and sort order.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="list-sort-field">Sort by</Label>
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
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="list-sort-order">Order</Label>
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
            </div>
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
