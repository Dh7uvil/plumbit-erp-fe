"use client";

import Link from "next/link";
import { useCan } from "@/shared/providers/session-provider";
import { reportPermissions } from "@/modules/erp/accounting/reports/permissions";
import { deliveryNotePermissions } from "@/modules/inventory-management/delivery-notes/permissions";
import { goodsReceiptPermissions } from "@/modules/inventory-management/goods-receipts/permissions";
import { useDashboard } from "@/modules/erp/accounting/reports/queries";
import { getErrorMessage } from "@/shared/api/errors";
import { documentDetailHref, documentTypeDisplayLabel } from "@/shared/components/document/document-links";
import { DataTableError } from "@/shared/components/data-table/states";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { formatDecimal } from "@/shared/lib/format";

export function OperationalDashboardScreen() {
  const can = useCan();
  const canLedger = can(reportPermissions.ledger);
  const canArAp = can(reportPermissions.arAp);
  const canInventory = can(reportPermissions.inventory);
  const canFinancial = can(reportPermissions.financial);
  const enabled = canLedger || canArAp || canInventory || canFinancial;
  const dashboardQuery = useDashboard(enabled);
  const data = dashboardQuery.data;

  if (!enabled) {
    return (
      <p className="text-muted-foreground text-sm">You do not have access to dashboard reports.</p>
    );
  }

  return (
    <section className="flex flex-col gap-5">
      <PageHeader title="Dashboard" subtitle="Posted operational totals. Drafts are excluded." />
      {dashboardQuery.isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={index} className="h-24 w-full" />
          ))}
        </div>
      ) : dashboardQuery.isError ? (
        <DataTableError
          message={getErrorMessage(dashboardQuery.error)}
          onRetry={() => dashboardQuery.refetch()}
        />
      ) : data ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {canArAp ? (
            <KpiCard
              title="Open AR"
              value={formatDecimal(data.open_ar)}
              href="/reports/ar-aging"
              hint={`${data.overdue_ar_count} overdue`}
            />
          ) : null}
          {canArAp ? (
            <KpiCard
              title="Open AP"
              value={formatDecimal(data.open_ap)}
              href="/reports/ap-aging"
              hint={`${data.overdue_ap_count} overdue`}
            />
          ) : null}
          {canInventory ? (
            <KpiCard
              title="Stock valuation"
              value={formatDecimal(data.stock_valuation)}
              href="/reports/stock-valuation"
            />
          ) : null}
          {can(deliveryNotePermissions.read) ? (
            <KpiCard title="Deliveries today" value={String(data.deliveries_today)} href="/delivery-notes" />
          ) : null}
          {can(goodsReceiptPermissions.read) ? (
            <KpiCard title="Receipts today" value={String(data.receipts_today)} href="/goods-receipts" />
          ) : null}
        </div>
      ) : null}
      {data?.unposted?.length ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Unposted documents</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            {data.unposted.map((row) => {
              const href = listHrefForType(row.document_type);
              return (
                <p key={row.document_type} className="flex justify-between gap-2">
                  <span>{documentTypeDisplayLabel(row.document_type)}</span>
                  {href ? (
                    <Link href={href} className="underline-offset-4 hover:underline">
                      {row.count}
                    </Link>
                  ) : (
                    <span>{row.count}</span>
                  )}
                </p>
              );
            })}
          </CardContent>
        </Card>
      ) : null}
      {canArAp && data?.credit_limit_breaches?.length ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Credit limit breaches</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            {data.credit_limit_breaches.map((row) => (
              <p key={row.customer_id} className="flex justify-between gap-2">
                <Link href={`/customers/${row.customer_id}`} className="underline-offset-4 hover:underline">
                  {row.customer_name}
                </Link>
                <span className="tabular-nums">
                  {formatDecimal(row.outstanding)} / {formatDecimal(row.credit_limit)}
                </span>
              </p>
            ))}
          </CardContent>
        </Card>
      ) : null}
      {data ? (
        <p className="text-muted-foreground text-xs">
          Figures are as of {data.as_of} and include posted documents only.
        </p>
      ) : null}
    </section>
  );
}

function KpiCard({
  title,
  value,
  href,
  hint,
}: {
  title: string;
  value: string;
  href: string;
  hint?: string;
}) {
  return (
    <Link href={href}>
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-muted-foreground text-sm font-medium">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold tabular-nums">{value}</p>
          {hint ? <p className="text-muted-foreground mt-1 text-xs">{hint}</p> : null}
        </CardContent>
      </Card>
    </Link>
  );
}

function listHrefForType(documentType: string): string | null {
  const sample = documentDetailHref(documentType, "00000000-0000-4000-8000-000000000000");
  if (!sample) {
    return null;
  }
  return sample.replace(/\/00000000-0000-4000-8000-000000000000$/, "");
}
