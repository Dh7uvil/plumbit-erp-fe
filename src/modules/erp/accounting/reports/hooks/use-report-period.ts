"use client";

import { useCurrentTenant } from "@/modules/users-management/tenants/queries";
import { currentFiscalPeriod } from "@/shared/lib/fiscal-period";

export function useReportPeriod(): { from: string; to: string } {
  const tenantQuery = useCurrentTenant();
  return currentFiscalPeriod(
    tenantQuery.data?.fiscal_year_start_month ?? 1,
    tenantQuery.data?.fiscal_year_start_day ?? 1,
  );
}
