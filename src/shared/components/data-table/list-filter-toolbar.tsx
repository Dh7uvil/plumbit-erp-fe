"use client";

import type { ReactNode } from "react";

import { AppliedFilterPills } from "@/shared/components/data-table/applied-filter-pills";
import type { FilterSpec } from "@/shared/components/data-table/applied-filter-spec";
import { DataTableToolbar } from "@/shared/components/data-table/toolbar";
import type { TableParamPatch } from "@/shared/hooks/use-table-params";

export function ListFilterToolbar({
  children,
  search,
  filters,
  specs,
  setParams,
  onClear,
  className,
}: {
  children: ReactNode;
  search?: string;
  filters: Record<string, string>;
  specs: FilterSpec[];
  setParams: (patch: TableParamPatch) => void;
  onClear?: () => void;
  className?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <DataTableToolbar className={className}>{children}</DataTableToolbar>
      <AppliedFilterPills
        search={search}
        filters={filters}
        specs={specs}
        setParams={setParams}
        onClear={onClear}
      />
    </div>
  );
}
