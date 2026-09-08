import {
  SALES_ORDER_STATUS_LABELS,
  type SalesOrderStatus,
} from "@/modules/erp/sales-orders/schemas";
import { Badge } from "@/shared/components/ui/badge";

const STATUS_VARIANT: Record<
  SalesOrderStatus,
  "muted" | "warning" | "info" | "success" | "destructive" | "secondary"
> = {
  DRAFT: "muted",
  PENDING_APPROVAL: "warning",
  APPROVED: "info",
  CONFIRMED: "success",
  REJECTED: "destructive",
  CANCELLED: "destructive",
  CLOSED: "secondary",
};

export function SalesOrderStatusBadge({ status }: { status: SalesOrderStatus }) {
  return <Badge variant={STATUS_VARIANT[status]}>{SALES_ORDER_STATUS_LABELS[status]}</Badge>;
}
