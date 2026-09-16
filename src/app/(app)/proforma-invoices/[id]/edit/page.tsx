import { ProformaInvoiceDetailScreen } from "@/modules/erp/proforma-invoices/components/proforma-invoice-detail-screen";
import { proformaInvoicePermissions } from "@/modules/erp/proforma-invoices/permissions";
import { DetailPageRoute } from "@/shared/components/layout/detail-page-route";

export default function ProformaInvoiceEditPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <DetailPageRoute
      params={params}
      permission={proformaInvoicePermissions.update}
      notFoundMessage="Proforma invoice not found."
    >
      {(id) => <ProformaInvoiceDetailScreen proformaInvoiceId={id} mode="edit" />}
    </DetailPageRoute>
  );
}
