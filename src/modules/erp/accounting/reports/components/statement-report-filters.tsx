"use client";

import { useAllCostCenters } from "@/modules/erp/accounting/cost-centers/queries";
import { useAllBranches } from "@/modules/users-management/branches/queries";
import { DateRangeFilter } from "@/shared/components/data-table/date-range-filter";
import { FilterSelect } from "@/shared/components/data-table/filter-select";
import { ToolbarControl, toolbarLabelClass } from "@/shared/components/data-table/toolbar";
import { Button } from "@/shared/components/ui/button";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { useCan } from "@/shared/providers/session-provider";

const ALL = "all";

export function StatementReportFilters({
  asOf,
  from,
  to,
  branchId,
  costCenterId,
  showCostCenterFilter = false,
  includeYtd,
  periodCount,
  budgetId,
  budgetOptions = [],
  onChange,
}: {
  asOf?: string;
  from?: string;
  to?: string;
  branchId?: string;
  costCenterId?: string;
  showCostCenterFilter?: boolean;
  includeYtd?: boolean;
  periodCount?: string;
  budgetId?: string;
  budgetOptions?: Array<{ value: string; label: string }>;
  onChange: (patch: Record<string, string | null>) => void;
}) {
  const can = useCan();
  const branchesQuery = useAllBranches(can("identity.branch.read"));
  const costCentersQuery = useAllCostCenters(
    showCostCenterFilter && can("masters.cost_center.read"),
  );
  const branches = branchesQuery.data ?? [];
  const costCenters = costCentersQuery.data ?? [];
  const hasFilters = Boolean(
    from ||
    to ||
    branchId ||
    costCenterId ||
    includeYtd ||
    (periodCount && periodCount !== "1") ||
    budgetId,
  );

  return (
    <>
      {asOf !== undefined ? (
        <ToolbarControl label="As of" htmlFor="statement-as-of">
          <Input
            id="statement-as-of"
            type="date"
            value={asOf}
            onChange={(event) => onChange({ as_of: event.target.value || null })}
          />
        </ToolbarControl>
      ) : null}
      {from !== undefined && to !== undefined ? (
        <DateRangeFilter
          layout="inline"
          fromId="statement-from"
          toId="statement-to"
          from={from}
          to={to}
          onFromChange={(value) => onChange({ from: value || null })}
          onToChange={(value) => onChange({ to: value || null })}
        />
      ) : null}
      <FilterSelect
        label="Branch"
        className="w-44"
        placeholder="Branch"
        value={branchId ?? ALL}
        onValueChange={(value) => onChange({ branch_id: value === ALL ? null : value })}
        options={[
          { value: ALL, label: "All branches" },
          ...branches.map((branch) => ({
            value: branch.id,
            label: `${branch.code} — ${branch.name}`,
          })),
        ]}
      />
      {showCostCenterFilter ? (
        <FilterSelect
          label="Cost center"
          className="w-48"
          placeholder="Cost center"
          value={costCenterId ?? ALL}
          onValueChange={(value) => onChange({ cost_center_id: value === ALL ? null : value })}
          options={[
            { value: ALL, label: "All cost centers" },
            ...costCenters.map((row) => ({
              value: row.id,
              label: `${row.code} — ${row.name}`,
            })),
          ]}
        />
      ) : null}
      {includeYtd !== undefined ? (
        <div className="flex h-9 items-center gap-2">
          <Checkbox
            id="statement-ytd"
            checked={includeYtd}
            onCheckedChange={(checked) =>
              onChange({ include_ytd: checked === true ? "true" : null })
            }
          />
          <Label htmlFor="statement-ytd" className={toolbarLabelClass}>
            Include YTD
          </Label>
        </div>
      ) : null}
      {periodCount !== undefined ? (
        <FilterSelect
          label="Periods"
          className="w-36"
          placeholder="Periods"
          value={periodCount}
          onValueChange={(value) => onChange({ period_count: value === "1" ? null : value })}
          options={[
            { value: "1", label: "Single period" },
            { value: "2", label: "2 periods" },
            { value: "3", label: "3 periods" },
            { value: "4", label: "4 periods" },
            { value: "6", label: "6 periods" },
            { value: "12", label: "12 periods" },
          ]}
        />
      ) : null}
      {budgetOptions.length > 0 ? (
        <FilterSelect
          label="Budget"
          className="w-48"
          placeholder="Budget"
          value={budgetId ?? ALL}
          onValueChange={(value) => onChange({ budget_id: value === ALL ? null : value })}
          options={[{ value: ALL, label: "No budget" }, ...budgetOptions]}
        />
      ) : null}
      {hasFilters ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-9"
          onClick={() =>
            onChange({
              as_of: null,
              from: null,
              to: null,
              branch_id: null,
              cost_center_id: null,
              include_ytd: null,
              period_count: null,
              budget_id: null,
            })
          }
        >
          Clear
        </Button>
      ) : null}
    </>
  );
}
