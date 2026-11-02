import { CostSheetDetailScreen } from "@/modules/erp/cost-sheets/components/cost-sheet-detail-screen";
import { costSheetPermissions } from "@/modules/erp/cost-sheets/permissions";
import { DetailPageRoute } from "@/shared/components/layout/detail-page-route";

export default function CostSheetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <DetailPageRoute
      params={params}
      permission={costSheetPermissions.read}
      notFoundMessage="Cost sheet not found."
    >
      {(id) => <CostSheetDetailScreen id={id} />}
    </DetailPageRoute>
  );
}
