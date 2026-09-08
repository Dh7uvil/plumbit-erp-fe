import {
  FULFILLMENT_STATUS_LABELS,
  type FulfillmentStatus,
} from "@/modules/erp/sales-orders/schemas";
import { Badge } from "@/shared/components/ui/badge";

const FULFILLMENT_VARIANT: Record<FulfillmentStatus, "muted" | "warning" | "success"> = {
  NOT_DELIVERED: "muted",
  PARTIALLY_DELIVERED: "warning",
  DELIVERED: "success",
};

export function FulfillmentStatusBadge({ status }: { status: FulfillmentStatus }) {
  return <Badge variant={FULFILLMENT_VARIANT[status]}>{FULFILLMENT_STATUS_LABELS[status]}</Badge>;
}
