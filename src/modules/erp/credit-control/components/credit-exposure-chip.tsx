"use client";

import { formatMoney } from "@/shared/lib/format";
import { Badge } from "@/shared/components/ui/badge";
import type { CreditExposure } from "@/modules/crm/customers/schemas";

export function CreditExposureChip({
  exposure,
  currencyCode,
}: {
  exposure: CreditExposure;
  currencyCode: string;
}) {
  const limitLabel =
    exposure.credit_limit == null ? "Unlimited" : formatMoney(exposure.credit_limit, currencyCode);
  const availableLabel =
    exposure.available == null ? "—" : formatMoney(exposure.available, currencyCode);
  return (
    <Badge variant="secondary" className="font-normal">
      Limit {limitLabel} · Exposure {formatMoney(exposure.exposure, currencyCode)} · Available{" "}
      {availableLabel}
    </Badge>
  );
}
