import { LostReasonDetailScreen } from "@/modules/crm/lost-reasons/components/lost-reason-detail-screen";
import { lostReasonPermissions } from "@/modules/crm/lost-reasons/permissions";
import { DetailPageRoute } from "@/shared/components/layout/detail-page-route";

export default function LostReasonEditPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <DetailPageRoute
      params={params}
      permission={lostReasonPermissions.update}
      notFoundMessage="Lost reason not found."
    >
      {(id) => <LostReasonDetailScreen reasonId={id} mode="edit" />}
    </DetailPageRoute>
  );
}
