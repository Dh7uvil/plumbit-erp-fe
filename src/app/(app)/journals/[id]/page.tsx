import { JournalDetailScreen } from "@/modules/erp/accounting/journals/components/journal-detail-screen";
import { journalPermissions } from "@/modules/erp/accounting/journals/permissions";
import { DetailPageRoute } from "@/shared/components/layout/detail-page-route";

export default function JournalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <DetailPageRoute
      params={params}
      permission={journalPermissions.read}
      notFoundMessage="Journal not found."
    >
      {(id) => <JournalDetailScreen journalId={id} mode="view" />}
    </DetailPageRoute>
  );
}
