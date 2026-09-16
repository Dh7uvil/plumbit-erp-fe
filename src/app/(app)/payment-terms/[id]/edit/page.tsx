import { PaymentTermDetailScreen } from "@/modules/erp/accounting/payment-terms/components/payment-term-detail-screen";
import { paymentTermPermissions } from "@/modules/erp/accounting/payment-terms/permissions";
import { DetailPageRoute } from "@/shared/components/layout/detail-page-route";

export default function PaymentTermDetailEditPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <DetailPageRoute
      params={params}
      permission={paymentTermPermissions.update}
      notFoundMessage="Payment term not found."
    >
      {(id) => <PaymentTermDetailScreen termId={id} mode="edit" />}
    </DetailPageRoute>
  );
}
