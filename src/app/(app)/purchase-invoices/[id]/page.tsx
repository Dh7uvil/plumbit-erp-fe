import { PurchaseInvoiceDetailScreen } from "@/modules/erp/purchase-invoices/components/purchase-invoice-detail-screen";
import { purchaseInvoicePermissions } from "@/modules/erp/purchase-invoices/permissions";
import { DetailPageRoute } from "@/shared/components/layout/detail-page-route";

export default function PurchaseInvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <DetailPageRoute
      params={params}
      permission={purchaseInvoicePermissions.read}
      notFoundMessage="Purchase invoice not found."
    >
      {(id) => <PurchaseInvoiceDetailScreen invoiceId={id} mode="view" />}
    </DetailPageRoute>
  );
}
