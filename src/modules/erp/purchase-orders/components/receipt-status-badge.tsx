import { RECEIPT_STATUS_LABELS, type ReceiptStatus } from "@/modules/erp/purchase-orders/schemas";
import { Badge } from "@/shared/components/ui/badge";

const RECEIPT_VARIANT: Record<ReceiptStatus, "muted" | "warning" | "success"> = {
  NOT_RECEIVED: "muted",
  PARTIALLY_RECEIVED: "warning",
  RECEIVED: "success",
};

export function ReceiptStatusBadge({ status }: { status: ReceiptStatus }) {
  return <Badge variant={RECEIPT_VARIANT[status]}>{RECEIPT_STATUS_LABELS[status]}</Badge>;
}
