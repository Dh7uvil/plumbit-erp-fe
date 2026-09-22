"use client";

import { useVoucherAllocations } from "@/modules/erp/accounting/vouchers/queries";
import type { Voucher } from "@/modules/erp/accounting/vouchers/schemas";
import {
  PaymentAllocationHistoryTable,
  type PaymentAllocationHistoryRow,
} from "@/shared/components/document/payment-allocation-history";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";

export function VoucherAllocationHistoryPanel({
  voucher,
  currencyCode,
}: {
  voucher: Voucher;
  currencyCode: string;
}) {
  const historyQuery = useVoucherAllocations(voucher.id, voucher.is_posted);

  if (!voucher.is_posted) {
    return null;
  }

  const rows: PaymentAllocationHistoryRow[] = (historyQuery.data ?? []).map((row) => ({
    id: row.id,
    item_type: row.item_type,
    item_id: row.item_id,
    item_document_number: row.item_document_number,
    amount: row.amount,
    journal_entry_id: row.journal_entry_id,
    reversed_at: row.reversed_at,
    created_at: row.created_at,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Allocation history</CardTitle>
      </CardHeader>
      <CardContent>
        <PaymentAllocationHistoryTable rows={rows} currencyCode={currencyCode} />
      </CardContent>
    </Card>
  );
}
