import { CampaignDetailScreen } from "@/modules/crm/campaigns/components/campaign-detail-screen";
import { campaignPermissions } from "@/modules/crm/campaigns/permissions";
import { DetailPageRoute } from "@/shared/components/layout/detail-page-route";

export default function CampaignEditPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <DetailPageRoute
      params={params}
      permission={campaignPermissions.update}
      notFoundMessage="Campaign not found."
    >
      {(id) => <CampaignDetailScreen campaignId={id} mode="edit" />}
    </DetailPageRoute>
  );
}
