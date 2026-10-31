import type { FilterSpec } from "@/shared/components/data-table/applied-filter-spec";

export function reportPeriodDateRangeSpec(label = "Period"): FilterSpec {
  return { type: "dateRange", fromKey: "from", toKey: "to", label };
}

export function reportDueDateRangeSpec(label = "Due date"): FilterSpec {
  return { type: "dateRange", fromKey: "due_from", toKey: "due_to", label };
}

export function reportAsOfSpec(label = "As of"): FilterSpec {
  return { type: "text", source: { filterKey: "as_of" }, label };
}

export function reportBranchOptionSpec(
  branches: Array<{ id: string; code: string; name: string }>,
): FilterSpec {
  return {
    type: "option",
    key: "branch_id",
    label: "Branch",
    options: branches.map((branch) => ({
      value: branch.id,
      label: `${branch.code} — ${branch.name}`,
    })),
  };
}

export function reportIncludeZeroFlag(): FilterSpec {
  return { type: "flag", key: "include_zero", label: "Include zeros", matchValue: "true" };
}

export function reportIncludeYtdFlag(): FilterSpec {
  return { type: "flag", key: "include_ytd", label: "Include YTD", matchValue: "true" };
}

export function reportIncludePdcFlag(): FilterSpec {
  return { type: "flag", key: "include_pdc", label: "P.D.C included", matchValue: "true" };
}

export function reportExcludeOpeningFlag(): FilterSpec {
  return {
    type: "flag",
    key: "include_opening",
    label: "Exclude previous balance",
    matchValue: "false",
  };
}

export const STATEMENT_PERIOD_COUNT_OPTIONS = [
  { value: "2", label: "2 periods" },
  { value: "3", label: "3 periods" },
  { value: "4", label: "4 periods" },
  { value: "6", label: "6 periods" },
  { value: "12", label: "12 periods" },
] as const;

export function reportPeriodCountOptionSpec(): FilterSpec {
  return {
    type: "option",
    key: "period_count",
    label: "Periods",
    options: [...STATEMENT_PERIOD_COUNT_OPTIONS],
  };
}
