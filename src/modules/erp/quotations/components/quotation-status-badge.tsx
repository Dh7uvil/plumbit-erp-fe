import { QUOTATION_STATUS_LABELS, type QuotationStatus } from "@/modules/erp/quotations/schemas";
import { Badge } from "@/shared/components/ui/badge";

const STATUS_VARIANT: Record<
  QuotationStatus,
  "muted" | "warning" | "info" | "success" | "destructive" | "secondary"
> = {
  DRAFT: "muted",
  PENDING_APPROVAL: "warning",
  APPROVED: "info",
  SENT: "info",
  ACCEPTED: "success",
  REJECTED: "destructive",
  DECLINED: "destructive",
  CANCELLED: "destructive",
  EXPIRED: "destructive",
  CONVERTED: "secondary",
};

export function QuotationStatusBadge({ status }: { status: QuotationStatus }) {
  return <Badge variant={STATUS_VARIANT[status]}>{QUOTATION_STATUS_LABELS[status]}</Badge>;
}
