import { LandedCostDetailScreen } from "@/modules/erp/landed-costs/components/landed-cost-detail-screen";
import { landedCostPermissions } from "@/modules/erp/landed-costs/permissions";
import { DetailPageRoute } from "@/shared/components/layout/detail-page-route";

export default function LandedCostEditPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <DetailPageRoute
      params={params}
      permission={landedCostPermissions.update}
      notFoundMessage="Landed cost not found."
    >
      {(id) => <LandedCostDetailScreen landedCostId={id} mode="edit" />}
    </DetailPageRoute>
  );
}
