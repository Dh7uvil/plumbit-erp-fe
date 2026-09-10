"use client";

import { formatMoney } from "@/shared/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import type { PurchaseInvoice } from "@/modules/erp/purchase-invoices/schemas";

export function PurchaseInvoiceReverseChargeCard({
  invoice,
  currencyCode,
}: {
  invoice: PurchaseInvoice;
  currencyCode: string;
}) {
  if (!invoice.is_reverse_charge) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Reverse charge</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-1 text-sm">
        <p className="text-muted-foreground">
          Net-zero VAT pair: input and output reverse-charge amounts must match.
        </p>
        <div className="flex justify-between gap-4">
          <span>Taxable amount</span>
          <span className="tabular-nums">
            {formatMoney(invoice.rcm_taxable_amount, currencyCode)}
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <span>RCM tax</span>
          <span className="tabular-nums">{formatMoney(invoice.rcm_tax_amount, currencyCode)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
