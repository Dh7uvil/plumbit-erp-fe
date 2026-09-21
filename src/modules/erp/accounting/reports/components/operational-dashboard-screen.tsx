"use client";

import Link from "next/link";
import {
  AlertTriangle,
  Banknote,
  CalendarClock,
  Filter,
  ListTodo,
  PackageCheck,
  TrendingDown,
  Truck,
  Warehouse,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { activityPermissions } from "@/modules/crm/activities/permissions";
import { opportunityPermissions } from "@/modules/crm/opportunities/permissions";
import { crmReportPermissions } from "@/modules/crm/reports/permissions";
import { useCrmDashboard } from "@/modules/crm/reports/queries";
import { reportPermissions } from "@/modules/erp/accounting/reports/permissions";
import { useDashboard } from "@/modules/erp/accounting/reports/queries";
import { deliveryNotePermissions } from "@/modules/inventory-management/delivery-notes/permissions";
import { goodsReceiptPermissions } from "@/modules/inventory-management/goods-receipts/permissions";
import { getErrorMessage } from "@/shared/api/errors";
import {
  documentDetailHref,
  documentTypeDisplayLabel,
} from "@/shared/components/document/document-links";
import { DataTableError } from "@/shared/components/data-table/states";
import { EmptyState } from "@/shared/components/feedback/empty-state";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Badge } from "@/shared/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { formatCompactReportMoney, formatReportMoney } from "@/shared/lib/format";
import { useCan } from "@/shared/providers/session-provider";
import { cn } from "@/shared/lib/cn";

export function OperationalDashboardScreen() {
  const can = useCan();
  const canLedger = can(reportPermissions.ledger);
  const canArAp = can(reportPermissions.arAp);
  const canInventory = can(reportPermissions.inventory);
  const canFinancial = can(reportPermissions.financial);
  const canCrm = can(crmReportPermissions.read);
  const canOpportunities = can(opportunityPermissions.read);
  const canActivities = can(activityPermissions.read);
  const financialEnabled = canLedger || canArAp || canInventory || canFinancial;
  const enabled = financialEnabled || canCrm;
  const dashboardQuery = useDashboard(financialEnabled);
  const crmQuery = useCrmDashboard(canCrm);
  const data = dashboardQuery.data;
  const crm = crmQuery.data;
  const kpisLoading =
    (financialEnabled && dashboardQuery.isLoading) || (canCrm && crmQuery.isLoading);
  const kpisError = (financialEnabled && dashboardQuery.isError) || (canCrm && crmQuery.isError);

  if (!enabled) {
    return (
      <EmptyState
        title="Dashboard unavailable"
        message="You do not have access to dashboard reports."
      />
    );
  }

  return (
    <section className="flex flex-col gap-5">
      <PageHeader
        title="Dashboard"
        subtitle="Posted operational totals and open CRM pipeline. Drafts are excluded."
      />
      {kpisLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={index} className="h-28 w-full" />
          ))}
        </div>
      ) : kpisError ? (
        <DataTableError
          message={getErrorMessage(dashboardQuery.error ?? crmQuery.error)}
          onRetry={() => {
            void dashboardQuery.refetch();
            void crmQuery.refetch();
          }}
        />
      ) : data || crm ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {canCrm && crm ? (
            <KpiCard
              title="Open pipeline"
              value={formatReportMoney(crm.open_pipeline_value, crm.currency_code)}
              href="/reports/sales-pipeline"
              hint={`${crm.open_pipeline_count} open`}
              icon={Filter}
              iconClass="bg-primary/10 text-primary"
            />
          ) : null}
          {canCrm && canOpportunities && crm ? (
            <KpiCard
              title="Closing this month"
              value={formatReportMoney(crm.closing_this_month_value, crm.currency_code)}
              href="/opportunities"
              hint={`${crm.closing_this_month_count} opportunities`}
              icon={CalendarClock}
              iconClass="bg-info-muted text-info-foreground"
            />
          ) : null}
          {canCrm && canActivities && crm ? (
            <KpiCard
              title="Overdue activities"
              value={String(crm.overdue_activity_count)}
              href="/activities?view=overdue"
              icon={ListTodo}
              iconClass="bg-warning-muted text-warning-foreground"
            />
          ) : null}
          {canArAp && data ? (
            <KpiCard
              title="Open AR"
              value={formatReportMoney(data.open_ar, data.currency_code)}
              href="/reports/ar-aging"
              hint={`${data.overdue_ar_count} overdue`}
              icon={Banknote}
              iconClass="bg-primary/10 text-primary"
            />
          ) : null}
          {canArAp && data ? (
            <KpiCard
              title="Open AP"
              value={formatReportMoney(data.open_ap, data.currency_code)}
              href="/reports/ap-aging"
              hint={`${data.overdue_ap_count} overdue`}
              icon={TrendingDown}
              iconClass="bg-warning-muted text-warning-foreground"
            />
          ) : null}
          {canInventory && data ? (
            <KpiCard
              title="Stock valuation"
              value={formatCompactReportMoney(data.stock_valuation, data.currency_code)}
              href="/reports/stock-valuation"
              icon={Warehouse}
              iconClass="bg-success-muted text-success-foreground"
            />
          ) : null}
          {can(deliveryNotePermissions.read) && data ? (
            <KpiCard
              title="Deliveries today"
              value={String(data.deliveries_today)}
              href="/delivery-notes"
              icon={Truck}
              iconClass="bg-info-muted text-info-foreground"
            />
          ) : null}
          {can(goodsReceiptPermissions.read) && data ? (
            <KpiCard
              title="Receipts today"
              value={String(data.receipts_today)}
              href="/goods-receipts"
              icon={PackageCheck}
              iconClass="bg-secondary text-secondary-foreground"
            />
          ) : null}
        </div>
      ) : (
        <EmptyState
          title="No dashboard figures"
          message="Posted operational totals will appear here."
        />
      )}
      {data?.unposted?.length ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Unposted documents</CardTitle>
            <p className="text-muted-foreground text-xs font-normal">
              Drafts and other documents that are not yet posted.
            </p>
          </CardHeader>
          <CardContent className="flex flex-col gap-1.5">
            {data.unposted.map((row) => {
              const href = listHrefForType(row.document_type);
              return (
                <div
                  key={row.document_type}
                  className="flex items-center justify-between gap-2 text-sm"
                >
                  <span>{documentTypeDisplayLabel(row.document_type)}</span>
                  {href ? (
                    <Link
                      href={href}
                      className="hover:underline"
                      aria-label={`${documentTypeDisplayLabel(row.document_type)}: ${row.count} unposted`}
                    >
                      <Badge variant="secondary">{row.count}</Badge>
                    </Link>
                  ) : (
                    <Badge variant="secondary">{row.count}</Badge>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      ) : null}
      {canArAp && data?.credit_limit_breaches?.length ? (
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <AlertTriangle className="text-warning-foreground size-4" aria-hidden="true" />
            <CardTitle className="text-base">Credit limit breaches</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm">
            {data.credit_limit_breaches.map((row) => (
              <p key={row.customer_id} className="flex justify-between gap-2">
                <Link
                  href={`/customers/${row.customer_id}`}
                  className="underline-offset-4 hover:underline"
                >
                  {row.customer_name}
                </Link>
                <span className="tabular-nums">
                  {formatReportMoney(row.outstanding, data.currency_code)} /{" "}
                  {formatReportMoney(row.credit_limit, data.currency_code)}
                </span>
              </p>
            ))}
          </CardContent>
        </Card>
      ) : null}
      {data ? (
        <p className="text-muted-foreground text-xs">
          KPI figures are as of {data.as_of} from posted documents. Unposted documents are listed
          separately.
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
  icon: Icon,
  iconClass,
}: {
  title: string;
  value: string;
  href: string;
  hint?: string;
  icon: LucideIcon;
  iconClass: string;
}) {
  return (
    <Link href={href} className="block min-w-0">
      <Card className="hover:border-primary/20 h-full min-w-0 overflow-hidden transition-shadow hover:shadow-sm">
        <CardHeader className="flex flex-row items-start justify-between gap-2">
          <CardTitle className="text-muted-foreground text-sm font-medium">{title}</CardTitle>
          <span
            className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg", iconClass)}
          >
            <Icon className="size-4" aria-hidden="true" />
          </span>
        </CardHeader>
        <CardContent className="min-w-0">
          <p className="text-xl font-semibold break-all tabular-nums sm:text-2xl">{value}</p>
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
