import { LandedCostDetailScreen } from "@/modules/erp/landed-costs/components/landed-cost-detail-screen";
import { landedCostPermissions } from "@/modules/erp/landed-costs/permissions";
import { DetailPageRoute } from "@/shared/components/layout/detail-page-route";

export default function LandedCostDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <DetailPageRoute
      params={params}
      permission={landedCostPermissions.read}
      notFoundMessage="Landed cost not found."
    >
      {(id) => <LandedCostDetailScreen landedCostId={id} mode="view" />}
    </DetailPageRoute>
  );
}
