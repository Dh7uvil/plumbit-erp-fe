import { VoucherDetailScreen } from "@/modules/erp/accounting/vouchers/components/voucher-detail-screen";
import { voucherPermissions } from "@/modules/erp/accounting/vouchers/permissions";
import { DetailPageRoute } from "@/shared/components/layout/detail-page-route";

export default function VoucherDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <DetailPageRoute
      params={params}
      permission={voucherPermissions.read}
      notFoundMessage="Voucher not found."
    >
      {(id) => <VoucherDetailScreen voucherId={id} mode="view" />}
    </DetailPageRoute>
  );
}
