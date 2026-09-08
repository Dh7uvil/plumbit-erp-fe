import {
  PURCHASE_ORDER_STATUS_LABELS,
  type PurchaseOrderStatus,
} from "@/modules/erp/purchase-orders/schemas";
import { Badge } from "@/shared/components/ui/badge";

const STATUS_VARIANT: Record<
  PurchaseOrderStatus,
  "muted" | "warning" | "info" | "success" | "destructive" | "secondary"
> = {
  DRAFT: "muted",
  PENDING_APPROVAL: "warning",
  APPROVED: "info",
  ISSUED: "success",
  REJECTED: "destructive",
  CANCELLED: "destructive",
  CLOSED: "secondary",
};

export function PurchaseOrderStatusBadge({ status }: { status: PurchaseOrderStatus }) {
  return <Badge variant={STATUS_VARIANT[status]}>{PURCHASE_ORDER_STATUS_LABELS[status]}</Badge>;
}
