"use client";

import { EXPENSE_CATEGORY_LABELS } from "@/modules/erp/purchase-invoices/schemas";
import type { PurchaseInvoice } from "@/modules/erp/purchase-invoices/schemas";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { formatDecimal } from "@/shared/lib/format";

export function PurchaseInvoiceLandedCostCard({ invoice }: { invoice: PurchaseInvoice }) {
  const expenseLines = invoice.lines.filter((line) => line.line_type === "EXPENSE");
  if (expenseLines.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Landed cost allocation</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="flex flex-col gap-2 text-sm">
          {expenseLines.map((line) => (
            <li key={line.id} className="flex flex-wrap gap-x-2">
              <span>
                {line.expense_category
                  ? EXPENSE_CATEGORY_LABELS[line.expense_category]
                  : line.description}
              </span>
              <span className="text-muted-foreground">
                amount {formatDecimal(line.amount)}
              </span>
              <span className="text-muted-foreground">
                allocated {formatDecimal(line.landed_cost_allocated ?? "0")}
              </span>
              <span className="text-muted-foreground">
                remaining{" "}
                {line.landed_cost_remaining == null
                  ? "—"
                  : formatDecimal(line.landed_cost_remaining)}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
