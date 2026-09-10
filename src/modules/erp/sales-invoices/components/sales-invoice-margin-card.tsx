"use client";

import { historyPermissions } from "@/modules/inventory-management/history/permissions";
import { useSalesInvoiceMargin } from "@/modules/erp/sales-invoices/queries";
import { COGS_STATUS_LABELS, type SalesInvoice } from "@/modules/erp/sales-invoices/schemas";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { formatDecimal, formatMoney } from "@/shared/lib/format";
import { useCan } from "@/shared/providers/session-provider";

export function SalesInvoiceMarginCard({
  invoice,
  currencyCode,
}: {
  invoice: SalesInvoice;
  currencyCode: string;
}) {
  const can = useCan();
  const enabled = can(historyPermissions.cost) && invoice.status === "POSTED";
  const marginQuery = useSalesInvoiceMargin(invoice.id, enabled);
  const margin = marginQuery.data;

  if (!can(historyPermissions.cost)) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Margin</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 text-sm">
        {!enabled ? (
          <p className="text-muted-foreground">Margin is available after the invoice is posted.</p>
        ) : marginQuery.isLoading ? (
          <p className="text-muted-foreground">Loading margin…</p>
        ) : marginQuery.isError || !margin ? (
          <p className="text-muted-foreground">Margin could not be loaded.</p>
        ) : (
          <>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Revenue</span>
              <span className="tabular-nums">{formatMoney(margin.revenue, currencyCode)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">COGS</span>
              <span className="tabular-nums">{formatMoney(margin.cogs_amount, currencyCode)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Margin</span>
              <span className="tabular-nums">{formatMoney(margin.margin, currencyCode)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Margin %</span>
              <span className="tabular-nums">
                {margin.margin_percent != null ? formatDecimal(margin.margin_percent) : "—"}
              </span>
            </div>
            <p className="text-muted-foreground">
              COGS status: {COGS_STATUS_LABELS[margin.cogs_status]}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
