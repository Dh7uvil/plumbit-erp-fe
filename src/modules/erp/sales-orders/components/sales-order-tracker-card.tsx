"use client";

import { DocumentTrackerTimeline } from "@/shared/components/document/document-tracker-timeline";
import { useSalesOrderTracker } from "@/modules/erp/sales-orders/queries";

export function SalesOrderTrackerCard({ salesOrderId }: { salesOrderId: string }) {
  const trackerQuery = useSalesOrderTracker(salesOrderId);
  return (
    <DocumentTrackerTimeline
      rows={trackerQuery.data?.rows ?? []}
      isLoading={trackerQuery.isLoading}
    />
  );
}
