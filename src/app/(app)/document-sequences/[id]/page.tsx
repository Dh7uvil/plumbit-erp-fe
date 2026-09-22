import { DocumentSequenceDetailScreen } from "@/modules/erp/accounting/document-sequences/components/document-sequence-detail-screen";
import { documentSequencePermissions } from "@/modules/erp/accounting/document-sequences/permissions";
import { DetailPageRoute } from "@/shared/components/layout/detail-page-route";

export default function DocumentSequenceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <DetailPageRoute
      params={params}
      permission={documentSequencePermissions.read}
      notFoundMessage="Document sequence not found."
    >
      {(id) => <DocumentSequenceDetailScreen sequenceId={id} mode="view" />}
    </DetailPageRoute>
  );
}
