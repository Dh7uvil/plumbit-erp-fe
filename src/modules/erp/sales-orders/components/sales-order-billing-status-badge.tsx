import { BILLING_STATUS_LABELS, type BillingStatus } from "@/modules/erp/sales-orders/schemas";
import { Badge } from "@/shared/components/ui/badge";

const BILLING_VARIANT: Record<BillingStatus, "muted" | "warning" | "success"> = {
  NOT_INVOICED: "muted",
  PARTIALLY_INVOICED: "warning",
  INVOICED: "success",
};

export function BillingStatusBadge({ status }: { status: BillingStatus }) {
  return <Badge variant={BILLING_VARIANT[status]}>{BILLING_STATUS_LABELS[status]}</Badge>;
}
