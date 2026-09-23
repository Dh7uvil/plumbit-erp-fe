"use client";

import { formatMoney } from "@/shared/lib/format";
import { Badge } from "@/shared/components/ui/badge";
import type { CreditExposure } from "@/modules/crm/customers/schemas";

export function CreditExposureChip({
  exposure,
  currencyCode,
  baseCurrencyCode,
}: {
  exposure: CreditExposure;
  currencyCode: string;
  baseCurrencyCode?: string | null;
}) {
  const limitLabel =
    exposure.credit_limit == null ? "Unlimited" : formatMoney(exposure.credit_limit, currencyCode);
  const exposureLabel = formatMoney(exposure.exposure, currencyCode);
  const baseExposureLabel =
    exposure.exposure_base != null && baseCurrencyCode
      ? formatMoney(exposure.exposure_base, baseCurrencyCode)
      : null;
  const exposureWithBase =
    baseExposureLabel && baseExposureLabel !== exposureLabel
      ? `${exposureLabel} (${baseExposureLabel} base)`
      : exposureLabel;
  if (exposure.credit_limit == null) {
    return (
      <Badge variant="secondary" className="font-normal">
        Limit {limitLabel} · Exposure {exposureWithBase}
      </Badge>
    );
  }
  const availableLabel =
    exposure.available == null ? "—" : formatMoney(exposure.available, currencyCode);
  return (
    <Badge variant="secondary" className="font-normal">
      Limit {limitLabel} · Exposure {exposureWithBase} · Available {availableLabel}
    </Badge>
  );
}
