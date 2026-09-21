import { LostReasonDetailScreen } from "@/modules/crm/lost-reasons/components/lost-reason-detail-screen";
import { lostReasonPermissions } from "@/modules/crm/lost-reasons/permissions";
import { DetailPageRoute } from "@/shared/components/layout/detail-page-route";

export default function LostReasonDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <DetailPageRoute
      params={params}
      permission={lostReasonPermissions.read}
      notFoundMessage="Lost reason not found."
    >
      {(id) => <LostReasonDetailScreen reasonId={id} mode="view" />}
    </DetailPageRoute>
  );
}
