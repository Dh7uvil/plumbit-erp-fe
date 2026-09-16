import { GoodsReceiptDetailScreen } from "@/modules/inventory-management/goods-receipts/components/goods-receipt-detail-screen";
import { goodsReceiptPermissions } from "@/modules/inventory-management/goods-receipts/permissions";
import { DetailPageRoute } from "@/shared/components/layout/detail-page-route";

export default function GoodsReceiptDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <DetailPageRoute
      params={params}
      permission={goodsReceiptPermissions.read}
      notFoundMessage="Goods receipt not found."
    >
      {(id) => <GoodsReceiptDetailScreen receiptId={id} mode="view" />}
    </DetailPageRoute>
  );
}
