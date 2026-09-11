"use client";

import { useAllBranches } from "@/modules/users-management/branches/queries";
import { DateRangeFilter } from "@/shared/components/data-table/date-range-filter";
import { FilterSelect } from "@/shared/components/data-table/filter-select";
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
  includeYtd,
  onChange,
}: {
  asOf?: string;
  from?: string;
  to?: string;
  branchId?: string;
  includeYtd?: boolean;
  onChange: (patch: Record<string, string | null>) => void;
}) {
  const can = useCan();
  const branchesQuery = useAllBranches(can("identity.branch.read"));
  const branches = branchesQuery.data ?? [];
  const hasFilters = Boolean(from || to || branchId || includeYtd);

  return (
    <>
      {asOf !== undefined ? (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="statement-as-of">As of</Label>
          <Input
            id="statement-as-of"
            type="date"
            value={asOf}
            onChange={(event) => onChange({ as_of: event.target.value || null })}
          />
        </div>
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
        className="w-44"
        placeholder="Branch"
        aria-label="Branch"
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
      {includeYtd !== undefined ? (
        <div className="flex h-9 items-center gap-2">
          <Checkbox
            id="statement-ytd"
            checked={includeYtd}
            onCheckedChange={(checked) =>
              onChange({ include_ytd: checked === true ? "true" : null })
            }
          />
          <Label htmlFor="statement-ytd">Include YTD</Label>
        </div>
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
              include_ytd: null,
            })
          }
        >
          Clear
        </Button>
      ) : null}
    </>
  );
}
