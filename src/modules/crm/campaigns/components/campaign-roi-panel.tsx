"use client";

import { useCampaignRoi } from "@/modules/crm/campaigns/queries";
import { getErrorMessage } from "@/shared/api/errors";
import { DataTableError } from "@/shared/components/data-table/states";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { formatDecimal, formatPercent } from "@/shared/lib/format";

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border p-4">
      <p className="text-muted-foreground text-sm">{label}</p>
      <p className="mt-1 text-lg font-medium tabular-nums">{value}</p>
    </div>
  );
}

export function CampaignRoiPanel({ campaignId }: { campaignId: string }) {
  const roiQuery = useCampaignRoi(campaignId);
  if (roiQuery.isLoading) {
    return <Skeleton className="h-40 w-full" />;
  }
  if (roiQuery.isError || !roiQuery.data) {
    return (
      <DataTableError
        message={roiQuery.error ? getErrorMessage(roiQuery.error) : "Unable to load ROI"}
        onRetry={() => roiQuery.refetch()}
      />
    );
  }
  const roi = roiQuery.data;
  return (
    <div className="flex flex-col gap-4">
      <p className="text-muted-foreground text-sm">
        Won opportunity value and costs are stored amounts. Campaigns do not carry a currency, so
        figures are shown as decimals rather than money.
      </p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Metric label="Members" value={String(roi.member_count)} />
        <Metric label="Converted leads" value={String(roi.converted_leads)} />
        <Metric label="Won opportunities" value={String(roi.won_opportunity_count)} />
        <Metric label="Won opportunity value" value={formatDecimal(roi.won_opportunity_value)} />
        <Metric label="Budgeted cost" value={formatDecimal(roi.budgeted_cost)} />
        <Metric label="Actual cost" value={formatDecimal(roi.actual_cost)} />
        <Metric label="Expected revenue" value={formatDecimal(roi.expected_revenue)} />
        <Metric label="ROI" value={formatPercent(roi.roi)} />
      </div>
    </div>
  );
}
