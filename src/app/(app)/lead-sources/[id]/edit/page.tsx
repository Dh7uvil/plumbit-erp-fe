import { LeadSourceDetailScreen } from "@/modules/crm/lead-sources/components/lead-source-detail-screen";
import { leadSourcePermissions } from "@/modules/crm/lead-sources/permissions";
import { DetailPageRoute } from "@/shared/components/layout/detail-page-route";

export default function LeadSourceEditPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <DetailPageRoute
      params={params}
      permission={leadSourcePermissions.update}
      notFoundMessage="Lead source not found."
    >
      {(id) => <LeadSourceDetailScreen sourceId={id} mode="edit" />}
    </DetailPageRoute>
  );
}
