"use client";

import { useCustomerCreditExposure } from "@/modules/crm/customers/queries";
import { Badge } from "@/shared/components/ui/badge";
import { formatReportMoney } from "@/shared/lib/format";
import { Skeleton } from "@/shared/components/ui/skeleton";

export function PartyBalanceChip({
  customerId,
  currencyCode,
}: {
  customerId: string | null | undefined;
  currencyCode?: string;
}) {
  const enabled = Boolean(customerId);
  const query = useCustomerCreditExposure(customerId ?? "", enabled);
  if (!enabled) {
    return null;
  }
  if (query.isLoading) {
    return <Skeleton className="h-5 w-24" />;
  }
  const exposure = query.data?.exposure;
  if (exposure == null) {
    return null;
  }
  return (
    <Badge variant="secondary" className="font-normal tabular-nums">
      Balance {formatReportMoney(exposure, currencyCode)}
    </Badge>
  );
}
