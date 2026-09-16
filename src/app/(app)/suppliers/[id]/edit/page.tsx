import { SupplierDetailScreen } from "@/modules/erp/suppliers/components/supplier-detail-screen";
import { supplierPermissions } from "@/modules/erp/suppliers/permissions";
import { DetailPageRoute } from "@/shared/components/layout/detail-page-route";

export default function SupplierEditPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <DetailPageRoute
      params={params}
      permission={supplierPermissions.update}
      notFoundMessage="Supplier not found."
    >
      {(id) => <SupplierDetailScreen supplierId={id} mode="edit" />}
    </DetailPageRoute>
  );
}
