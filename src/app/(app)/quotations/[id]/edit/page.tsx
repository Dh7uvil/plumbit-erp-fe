import { QuotationDetailScreen } from "@/modules/erp/quotations/components/quotation-detail-screen";
import { quotationPermissions } from "@/modules/erp/quotations/permissions";
import { DetailPageRoute } from "@/shared/components/layout/detail-page-route";

export default function QuotationEditPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <DetailPageRoute
      params={params}
      permission={quotationPermissions.update}
      notFoundMessage="Quotation not found."
    >
      {(id) => <QuotationDetailScreen quotationId={id} mode="edit" />}
    </DetailPageRoute>
  );
}
