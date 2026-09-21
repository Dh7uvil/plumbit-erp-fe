"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { CampaignForm } from "@/modules/crm/campaigns/components/campaign-form";
import { CampaignMembersPanel } from "@/modules/crm/campaigns/components/campaign-members-panel";
import { CampaignRoiPanel } from "@/modules/crm/campaigns/components/campaign-roi-panel";
import { CampaignStatusBadge } from "@/modules/crm/campaigns/components/campaign-status-badge";
import { campaignPermissions } from "@/modules/crm/campaigns/permissions";
import { useCampaign } from "@/modules/crm/campaigns/queries";
import { parseCampaignTab, type CampaignTab } from "@/modules/crm/campaigns/schemas";
import { getErrorMessage } from "@/shared/api/errors";
import { useCrudPermissions } from "@/shared/auth/use-crud-permissions";
import { DataTableError } from "@/shared/components/data-table/states";
import {
  RecordPageHeader,
  type RecordPageMode,
} from "@/shared/components/layout/record-page-header";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";

export function CampaignDetailScreen({
  campaignId,
  mode,
}: {
  campaignId: string;
  mode: RecordPageMode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { canUpdate } = useCrudPermissions(campaignPermissions);
  const campaignQuery = useCampaign(campaignId);
  const campaign = campaignQuery.data;
  const isEdit = mode === "edit";
  const viewHref = `/campaigns/${campaignId}`;
  const tab = parseCampaignTab(searchParams.get("tab"));

  function setTab(next: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "details") {
      params.delete("tab");
    } else {
      params.set("tab", next);
    }
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  if (campaignQuery.isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (campaignQuery.isError || !campaign) {
    return (
      <div className="flex flex-col gap-3">
        <DataTableError
          message={
            campaignQuery.error ? getErrorMessage(campaignQuery.error) : "Campaign not found"
          }
          onRetry={() => campaignQuery.refetch()}
        />
        <Button type="button" variant="outline" asChild>
          <Link href="/campaigns">Back to campaigns</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <RecordPageHeader
        title={campaign.name}
        listHref="/campaigns"
        viewHref={viewHref}
        editHref={`${viewHref}/edit`}
        canUpdate={canUpdate}
        mode={mode}
        extraActions={<CampaignStatusBadge status={campaign.status} />}
      />
      <Tabs value={tab} onValueChange={(value) => setTab(value as CampaignTab)}>
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="roi">ROI</TabsTrigger>
        </TabsList>
        <TabsContent value="details" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {isEdit ? "Edit campaign" : "Campaign details"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CampaignForm
                campaign={campaign}
                disabled={!isEdit}
                onSuccess={() => router.push(viewHref)}
              />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="members" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Members</CardTitle>
            </CardHeader>
            <CardContent>
              <CampaignMembersPanel campaignId={campaignId} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="roi" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">ROI</CardTitle>
            </CardHeader>
            <CardContent>
              <CampaignRoiPanel campaignId={campaignId} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
