import { SupplierPaymentDetailScreen } from "@/modules/erp/supplier-payments/components/supplier-payment-detail-screen";
import { supplierPaymentPermissions } from "@/modules/erp/supplier-payments/permissions";
import { DetailPageRoute } from "@/shared/components/layout/detail-page-route";

export default function SupplierPaymentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <DetailPageRoute
      params={params}
      permission={supplierPaymentPermissions.read}
      notFoundMessage="Payment not found."
    >
      {(id) => <SupplierPaymentDetailScreen paymentId={id} mode="view" />}
    </DetailPageRoute>
  );
}
