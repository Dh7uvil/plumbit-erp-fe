import { DebitNoteDetailScreen } from "@/modules/erp/debit-notes/components/debit-note-detail-screen";
import { debitNotePermissions } from "@/modules/erp/debit-notes/permissions";
import { DetailPageRoute } from "@/shared/components/layout/detail-page-route";

export default function DebitNoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <DetailPageRoute
      params={params}
      permission={debitNotePermissions.read}
      notFoundMessage="Debit note not found."
    >
      {(id) => <DebitNoteDetailScreen noteId={id} mode="view" />}
    </DetailPageRoute>
  );
}
