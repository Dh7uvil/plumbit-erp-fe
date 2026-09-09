"use client";

import { AlertCircle } from "lucide-react";

import { periodLockPermissions } from "@/modules/erp/period-lock/permissions";
import { useCurrentTenant } from "@/modules/users-management/tenants/queries";
import { getErrorMessage, isApiError } from "@/shared/api/errors";
import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import { formatDate } from "@/shared/lib/format";
import { useCan } from "@/shared/providers/session-provider";

const WRITE_ALERT_CODES = new Set([
  "PERIOD_LOCKED",
  "INVENTORY_INSUFFICIENT_STOCK",
  "INSUFFICIENT_STOCK",
  "GRN_OVER_RECEIPT",
  "GRN_CANNOT_CANCEL",
  "QUALITY_QTY_MISMATCH",
  "SUPPLIER_SKU_NOT_MAPPED",
]);

export function isStockWriteAlertError(error: unknown): boolean {
  return isApiError(error) && WRITE_ALERT_CODES.has(error.code);
}

export function StockWriteAlert({
  periodLocked = false,
  error,
}: {
  periodLocked?: boolean;
  error?: unknown;
}) {
  const can = useCan();
  const tenantQuery = useCurrentTenant();
  const tenant = tenantQuery.data;
  const canOverride = can(periodLockPermissions.override);
  const showPeriod = periodLocked;
  const showError = isStockWriteAlertError(error);

  if (!showPeriod && !showError) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3">
      {showPeriod ? (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertDescription>
            This document date falls in a locked period.
            {tenant?.lock_date ? ` Transaction lock ${formatDate(tenant.lock_date)}.` : ""}
            {tenant?.hard_lock_date ? ` Books close ${formatDate(tenant.hard_lock_date)}.` : ""}
            {canOverride
              ? " You can still post into the transaction lock. Books close cannot be posted through until unlocked."
              : ""}
          </AlertDescription>
        </Alert>
      ) : null}
      {showError ? (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertDescription>{getErrorMessage(error)}</AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}
