"use client";

import { pipelinePermissions } from "@/modules/crm/pipelines/permissions";
import { useAllPipelines } from "@/modules/crm/pipelines/queries";
import { DateRangeFilter } from "@/shared/components/data-table/date-range-filter";
import { FilterSelect } from "@/shared/components/data-table/filter-select";
import { Button } from "@/shared/components/ui/button";
import { useCan } from "@/shared/providers/session-provider";

const ALL = "all";

export function CrmReportFilters({
  from,
  to,
  groupBy,
  groupOptions,
  pipelineId,
  showDates = false,
  showPipeline = false,
  showGroupBy = false,
  allPipelineLabel = "All pipelines",
  onChange,
}: {
  from?: string;
  to?: string;
  groupBy?: string;
  groupOptions?: { value: string; label: string }[];
  pipelineId?: string;
  showDates?: boolean;
  showPipeline?: boolean;
  showGroupBy?: boolean;
  allPipelineLabel?: string;
  onChange: (patch: Record<string, string | null>) => void;
}) {
  const can = useCan();
  const pipelinesQuery = useAllPipelines(showPipeline && can(pipelinePermissions.read));
  const pipelines = pipelinesQuery.data ?? [];
  const hasFilters = Boolean(
    from || to || pipelineId || (groupBy && groupBy !== groupOptions?.[0]?.value),
  );

  return (
    <>
      {showDates && from !== undefined && to !== undefined ? (
        <DateRangeFilter
          layout="inline"
          fromId="crm-report-from"
          toId="crm-report-to"
          from={from}
          to={to}
          onFromChange={(value) => onChange({ from: value || null })}
          onToChange={(value) => onChange({ to: value || null })}
        />
      ) : null}
      {showPipeline ? (
        <FilterSelect
          label="Pipeline"
          className="w-52"
          placeholder="Pipeline"
          value={pipelineId ?? ALL}
          onValueChange={(value) => onChange({ pipeline_id: value === ALL ? null : value })}
          options={[
            { value: ALL, label: allPipelineLabel },
            ...pipelines.map((pipeline) => ({
              value: pipeline.id,
              label: pipeline.is_default ? `${pipeline.name} (default)` : pipeline.name,
            })),
          ]}
        />
      ) : null}
      {showGroupBy && groupOptions ? (
        <FilterSelect
          label="Group by"
          className="w-44"
          placeholder="Group"
          value={groupBy ?? groupOptions[0]?.value ?? ALL}
          onValueChange={(value) => onChange({ group_by: value })}
          options={groupOptions}
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
              from: null,
              to: null,
              pipeline_id: null,
              group_by: null,
            })
          }
        >
          Clear
        </Button>
      ) : null}
    </>
  );
}
