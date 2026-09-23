import { RecurringDetailScreen } from "@/modules/erp/accounting/recurring/components/recurring-detail-screen";
import { recurringPermissions } from "@/modules/erp/accounting/recurring/permissions";
import { DetailPageRoute } from "@/shared/components/layout/detail-page-route";

export default function RecurringDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <DetailPageRoute
      params={params}
      permission={recurringPermissions.read}
      notFoundMessage="Recurring template not found."
    >
      {(id) => <RecurringDetailScreen templateId={id} />}
    </DetailPageRoute>
  );
}
