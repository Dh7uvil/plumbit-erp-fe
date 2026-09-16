import { CustomerPaymentDetailScreen } from "@/modules/erp/customer-payments/components/customer-payment-detail-screen";
import { customerPaymentPermissions } from "@/modules/erp/customer-payments/permissions";
import { DetailPageRoute } from "@/shared/components/layout/detail-page-route";

export default function CustomerPaymentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <DetailPageRoute
      params={params}
      permission={customerPaymentPermissions.read}
      notFoundMessage="Receipt not found."
    >
      {(id) => <CustomerPaymentDetailScreen paymentId={id} mode="view" />}
    </DetailPageRoute>
  );
}
