"use client";

import { VoucherEntryScreen } from "@/modules/erp/accounting/vouchers/components/voucher-entry-screen";
import { useVoucher } from "@/modules/erp/accounting/vouchers/queries";
import { getErrorMessage } from "@/shared/api/errors";
import { DataTableError } from "@/shared/components/data-table/states";
import { Skeleton } from "@/shared/components/ui/skeleton";

export function VoucherEntryPageClient({
  voucherId,
}: {
  voucherId: string;
  readOnly?: boolean;
}) {
  const query = useVoucher(voucherId);

  if (query.isLoading) {
    return <Skeleton className="h-40 w-full" />;
  }

  if (query.isError) {
    return (
      <DataTableError
        message={getErrorMessage(query.error)}
        onRetry={() => query.refetch()}
      />
    );
  }

  if (!query.data) {
    return <p className="text-muted-foreground text-sm">Voucher not found.</p>;
  }

  const locked = query.data.status === "CANCELLED";

  return <VoucherEntryScreen voucher={query.data} readOnly={locked} />;
}
