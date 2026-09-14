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
  const exposureLabel = formatMoney(exposure.exposure, currencyCode);
  if (exposure.credit_limit == null) {
    return (
      <Badge variant="secondary" className="font-normal">
        Limit {limitLabel} · Exposure {exposureLabel}
      </Badge>
    );
  }
  const availableLabel =
    exposure.available == null ? "—" : formatMoney(exposure.available, currencyCode);
  return (
    <Badge variant="secondary" className="font-normal">
      Limit {limitLabel} · Exposure {exposureLabel} · Available {availableLabel}
    </Badge>
  );
}
