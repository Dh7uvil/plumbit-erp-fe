"use client";

import { DocumentTrackerTimeline } from "@/shared/components/document/document-tracker-timeline";
import { usePurchaseOrderCycle } from "@/modules/erp/purchase-orders/queries";

export function PurchaseOrderCycleCard({ purchaseOrderId }: { purchaseOrderId: string }) {
  const cycleQuery = usePurchaseOrderCycle(purchaseOrderId);
  return (
    <DocumentTrackerTimeline
      title="Purchase cycle"
      rows={cycleQuery.data?.rows ?? []}
      isLoading={cycleQuery.isLoading}
    />
  );
}
