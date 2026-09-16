import { AccountDetailScreen } from "@/modules/erp/accounting/accounts/components/account-detail-screen";
import { accountPermissions } from "@/modules/erp/accounting/accounts/permissions";
import { DetailPageRoute } from "@/shared/components/layout/detail-page-route";

export default function AccountDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <DetailPageRoute
      params={params}
      permission={accountPermissions.read}
      notFoundMessage="Account not found."
    >
      {(id) => <AccountDetailScreen accountId={id} mode="view" />}
    </DetailPageRoute>
  );
}
