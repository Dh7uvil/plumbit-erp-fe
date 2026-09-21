import { CostCenterDetailScreen } from "@/modules/erp/accounting/cost-centers/components/cost-center-detail-screen";
import { costCenterPermissions } from "@/modules/erp/accounting/cost-centers/permissions";
import { DetailPageRoute } from "@/shared/components/layout/detail-page-route";

export default function CostCenterDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <DetailPageRoute
      params={params}
      permission={costCenterPermissions.read}
      notFoundMessage="Cost center not found."
    >
      {(id) => <CostCenterDetailScreen termId={id} mode="view" />}
    </DetailPageRoute>
  );
}
