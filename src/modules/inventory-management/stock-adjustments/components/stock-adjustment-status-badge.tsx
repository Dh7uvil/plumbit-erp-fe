import {
  STOCK_DOCUMENT_STATUS_LABELS,
  type StockDocumentStatus,
} from "@/modules/inventory-management/stock-adjustments/schemas";
import { Badge } from "@/shared/components/ui/badge";

const STATUS_VARIANT: Record<StockDocumentStatus, "muted" | "success" | "destructive"> = {
  DRAFT: "muted",
  POSTED: "success",
  CANCELLED: "destructive",
};

export function StockAdjustmentStatusBadge({ status }: { status: StockDocumentStatus }) {
  return <Badge variant={STATUS_VARIANT[status]}>{STOCK_DOCUMENT_STATUS_LABELS[status]}</Badge>;
}
