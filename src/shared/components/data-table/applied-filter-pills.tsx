"use client";

import {
  ActiveFilterBar,
  FilterChip,
} from "@/shared/components/data-table/filter-chip";
import {
  buildAppliedFilterItems,
  filterClearPatchFromSpecs,
  type FilterSpec,
} from "@/shared/components/data-table/applied-filter-spec";
import type { TableParamPatch } from "@/shared/hooks/use-table-params";

export type AppliedFilterPillsProps = {
  search?: string;
  filters: Record<string, string>;
  specs: FilterSpec[];
  setParams: (patch: TableParamPatch) => void;
  onClear?: () => void;
};

export function AppliedFilterPills({
  search,
  filters,
  specs,
  setParams,
  onClear,
}: AppliedFilterPillsProps) {
  const items = buildAppliedFilterItems(search, filters, specs);
  if (items.length === 0) {
    return null;
  }

  const handleClear =
    onClear ??
    (() => {
      setParams(filterClearPatchFromSpecs(specs));
    });

  return (
    <ActiveFilterBar onClear={handleClear}>
      {items.map((item) => (
        <FilterChip
          key={item.id}
          label={item.label}
          onRemove={() => setParams(item.removePatch)}
        />
      ))}
    </ActiveFilterBar>
  );
}
