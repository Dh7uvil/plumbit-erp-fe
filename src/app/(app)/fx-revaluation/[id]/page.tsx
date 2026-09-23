import { FxRevaluationDetailScreen } from "@/modules/erp/accounting/fx-revaluation/components/fx-revaluation-detail-screen";
import { fxRevaluationPermissions } from "@/modules/erp/accounting/fx-revaluation/permissions";
import { DetailPageRoute } from "@/shared/components/layout/detail-page-route";

export default function FxRevaluationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <DetailPageRoute
      params={params}
      permission={fxRevaluationPermissions.read}
      notFoundMessage="FX revaluation not found."
    >
      {(id) => <FxRevaluationDetailScreen runId={id} />}
    </DetailPageRoute>
  );
}
