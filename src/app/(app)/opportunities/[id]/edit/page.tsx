import { OpportunityDetailScreen } from "@/modules/crm/opportunities/components/opportunity-detail-screen";
import { opportunityPermissions } from "@/modules/crm/opportunities/permissions";
import { DetailPageRoute } from "@/shared/components/layout/detail-page-route";

export default function OpportunityEditPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <DetailPageRoute
      params={params}
      permission={opportunityPermissions.update}
      notFoundMessage="Opportunity not found."
    >
      {(id) => <OpportunityDetailScreen opportunityId={id} mode="edit" />}
    </DetailPageRoute>
  );
}
