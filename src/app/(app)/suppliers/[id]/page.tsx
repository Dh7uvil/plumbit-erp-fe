import { SupplierDetailScreen } from "@/modules/erp/suppliers/components/supplier-detail-screen";
import { supplierPermissions } from "@/modules/erp/suppliers/permissions";
import { DetailPageRoute } from "@/shared/components/layout/detail-page-route";

export default function SupplierDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <DetailPageRoute
      params={params}
      permission={supplierPermissions.read}
      notFoundMessage="Supplier not found."
    >
      {(id) => <SupplierDetailScreen supplierId={id} mode="view" />}
    </DetailPageRoute>
  );
}
