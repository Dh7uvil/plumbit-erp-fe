import { TaxDetailScreen } from "@/modules/erp/accounting/taxes/components/tax-detail-screen";
import { taxPermissions } from "@/modules/erp/accounting/taxes/permissions";
import { DetailPageRoute } from "@/shared/components/layout/detail-page-route";

export default function TaxDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <DetailPageRoute
      params={params}
      permission={taxPermissions.read}
      notFoundMessage="Tax not found."
    >
      {(id) => <TaxDetailScreen taxId={id} mode="view" />}
    </DetailPageRoute>
  );
}
