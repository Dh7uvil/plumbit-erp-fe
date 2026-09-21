import { LeadDetailScreen } from "@/modules/crm/leads/components/lead-detail-screen";
import { leadPermissions } from "@/modules/crm/leads/permissions";
import { DetailPageRoute } from "@/shared/components/layout/detail-page-route";

export default function LeadEditPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <DetailPageRoute
      params={params}
      permission={leadPermissions.update}
      notFoundMessage="Lead not found."
    >
      {(id) => <LeadDetailScreen leadId={id} mode="edit" />}
    </DetailPageRoute>
  );
}
