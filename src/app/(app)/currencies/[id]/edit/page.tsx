import { CurrencyDetailScreen } from "@/modules/erp/currencies/components/currency-detail-screen";
import { currencyPermissions } from "@/modules/erp/currencies/permissions";
import { DetailPageRoute } from "@/shared/components/layout/detail-page-route";

export default function CurrencyDetailEditPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <DetailPageRoute
      params={params}
      permission={currencyPermissions.update}
      notFoundMessage="Currency not found."
    >
      {(id) => <CurrencyDetailScreen currencyId={id} mode="edit" />}
    </DetailPageRoute>
  );
}
