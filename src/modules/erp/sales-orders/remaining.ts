import { isPositiveDecimal } from "@/shared/components/document/conversion-line-picker";
import type { SalesOrder } from "@/modules/erp/sales-orders/schemas";
import { isZeroDecimal } from "@/shared/lib/format";

export function salesOrderHasRemainingToInvoice(order: SalesOrder): boolean {
  if (order.billing_status === "INVOICED") {
    return false;
  }
  const remaining = order.quantity_progress?.remaining_to_invoice;
  if (remaining != null && remaining !== "") {
    return !isZeroDecimal(remaining);
  }
  const lines = order.lines ?? [];
  if (
    lines.some(
      (line) => line.qty_remaining_to_invoice != null && line.qty_remaining_to_invoice !== "",
    )
  ) {
    return lines.some((line) => isPositiveDecimal(line.qty_remaining_to_invoice ?? "0"));
  }
  return true;
}
