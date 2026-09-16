import { CreditNoteDetailScreen } from "@/modules/erp/credit-notes/components/credit-note-detail-screen";
import { creditNotePermissions } from "@/modules/erp/credit-notes/permissions";
import { DetailPageRoute } from "@/shared/components/layout/detail-page-route";

export default function CreditNoteEditPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <DetailPageRoute
      params={params}
      permission={creditNotePermissions.update}
      notFoundMessage="Credit note not found."
    >
      {(id) => <CreditNoteDetailScreen noteId={id} mode="edit" />}
    </DetailPageRoute>
  );
}
