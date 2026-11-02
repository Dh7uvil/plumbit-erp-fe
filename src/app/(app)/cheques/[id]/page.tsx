import { ChequeDetailScreen } from "@/modules/erp/accounting/cheques/components/cheque-detail-screen";
import { chequePermissions } from "@/modules/erp/accounting/cheques/permissions";
import { DetailPageRoute } from "@/shared/components/layout/detail-page-route";

export default function ChequeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <DetailPageRoute
      params={params}
      permission={chequePermissions.read}
      notFoundMessage="Cheque not found."
    >
      {(id) => <ChequeDetailScreen id={id} />}
    </DetailPageRoute>
  );
}
