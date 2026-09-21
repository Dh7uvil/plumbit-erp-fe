import { CampaignDetailScreen } from "@/modules/crm/campaigns/components/campaign-detail-screen";
import { campaignPermissions } from "@/modules/crm/campaigns/permissions";
import { DetailPageRoute } from "@/shared/components/layout/detail-page-route";

export default function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <DetailPageRoute
      params={params}
      permission={campaignPermissions.read}
      notFoundMessage="Campaign not found."
    >
      {(id) => <CampaignDetailScreen campaignId={id} mode="view" />}
    </DetailPageRoute>
  );
}
