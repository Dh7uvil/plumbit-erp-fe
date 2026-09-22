"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { VoucherForm } from "@/modules/erp/accounting/vouchers/components/voucher-form";
import {
  VOUCHER_ENTRY_BOOK_LABELS,
  VoucherEntryTypeSchema,
  vouchersListHref,
  type VoucherEntryType,
} from "@/modules/erp/accounting/vouchers/schemas";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";

function parseVoucherType(value: string | null): VoucherEntryType {
  const parsed = VoucherEntryTypeSchema.safeParse(value);
  return parsed.success ? parsed.data : "CASH_RECEIPT";
}

export function VoucherNewScreen() {
  const searchParams = useSearchParams();
  const voucherType = parseVoucherType(searchParams.get("voucher_type"));

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Voucher entry"
        subtitle={VOUCHER_ENTRY_BOOK_LABELS[voucherType]}
        actions={
          <Button type="button" variant="outline" size="sm" asChild>
            <Link href={vouchersListHref(voucherType)}>Back</Link>
          </Button>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Voucher entry</CardTitle>
        </CardHeader>
        <CardContent>
          <VoucherForm voucher={null} voucherType={voucherType} />
        </CardContent>
      </Card>
    </div>
  );
}
