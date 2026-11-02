import { ChequeEditScreen } from "@/modules/erp/accounting/cheques/components/cheque-edit-screen";
import { chequePermissions } from "@/modules/erp/accounting/cheques/permissions";
import { DetailPageRoute } from "@/shared/components/layout/detail-page-route";

export default function EditChequePage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <DetailPageRoute
      params={params}
      permission={chequePermissions.update}
      notFoundMessage="Cheque not found."
    >
      {(id) => <ChequeEditScreen id={id} />}
    </DetailPageRoute>
  );
}
