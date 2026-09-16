import { DebitNoteDetailScreen } from "@/modules/erp/debit-notes/components/debit-note-detail-screen";
import { debitNotePermissions } from "@/modules/erp/debit-notes/permissions";
import { DetailPageRoute } from "@/shared/components/layout/detail-page-route";

export default function DebitNoteEditPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <DetailPageRoute
      params={params}
      permission={debitNotePermissions.update}
      notFoundMessage="Debit note not found."
    >
      {(id) => <DebitNoteDetailScreen noteId={id} mode="edit" />}
    </DetailPageRoute>
  );
}
