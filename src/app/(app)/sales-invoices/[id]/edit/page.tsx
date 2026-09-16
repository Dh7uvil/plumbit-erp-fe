import { SalesInvoiceDetailScreen } from "@/modules/erp/sales-invoices/components/sales-invoice-detail-screen";
import { salesInvoicePermissions } from "@/modules/erp/sales-invoices/permissions";
import { DetailPageRoute } from "@/shared/components/layout/detail-page-route";

export default function SalesInvoiceEditPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <DetailPageRoute
      params={params}
      permission={salesInvoicePermissions.update}
      notFoundMessage="Sales invoice not found."
    >
      {(id) => <SalesInvoiceDetailScreen invoiceId={id} mode="edit" />}
    </DetailPageRoute>
  );
}
