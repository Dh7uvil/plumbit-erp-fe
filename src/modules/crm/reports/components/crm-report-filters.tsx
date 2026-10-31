"use client";

import { useMemo } from "react";

import { pipelinePermissions } from "@/modules/crm/pipelines/permissions";
import { useAllPipelines } from "@/modules/crm/pipelines/queries";
import { reportPeriodDateRangeSpec } from "@/modules/erp/accounting/reports/components/report-filter-specs";
import type { FilterSpec } from "@/shared/components/data-table/applied-filter-spec";
import { DateRangeFilter } from "@/shared/components/data-table/date-range-filter";
import { FilterSelect } from "@/shared/components/data-table/filter-select";
import { useCan } from "@/shared/providers/session-provider";

const ALL = "all";

export function useCrmReportFilterSpecs(options: {
  showDates?: boolean;
  showPipeline?: boolean;
  showGroupBy?: boolean;
  groupOptions?: { value: string; label: string }[];
}): FilterSpec[] {
  const can = useCan();
  const { showDates = false, showPipeline = false, showGroupBy = false, groupOptions } = options;
  const pipelinesQuery = useAllPipelines(showPipeline && can(pipelinePermissions.read));
  const pipelines = pipelinesQuery.data ?? [];

  return useMemo(() => {
    const specs: FilterSpec[] = [];
    if (showDates) {
      specs.push(reportPeriodDateRangeSpec());
    }
    if (showPipeline) {
      specs.push({
        type: "option",
        key: "pipeline_id",
        label: "Pipeline",
        options: pipelines.map((pipeline) => ({
          value: pipeline.id,
          label: pipeline.is_default ? `${pipeline.name} (default)` : pipeline.name,
        })),
      });
    }
    if (showGroupBy && groupOptions?.length) {
      specs.push({
        type: "option",
        key: "group_by",
        label: "Group by",
        options: groupOptions,
      });
    }
    return specs;
  }, [groupOptions, pipelines, showDates, showGroupBy, showPipeline]);
}

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
    </>
  );
}
