"use client";

import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { formatMoney } from "@/shared/lib/format";
import { useCan } from "@/shared/providers/session-provider";

export function PartyOutstandingCard({
  title = "Outstanding",
  summary,
  currencyCode,
  isLoading = false,
  statementHref,
  agingHref,
  reportPermission,
}: {
  title?: string;
  summary?: {
    balance_due: string;
    overdue: string;
    unapplied_credits: string;
    credit_limit?: string | null;
    available_credit?: string | null;
  } | null;
  currencyCode: string;
  isLoading?: boolean;
  statementHref?: string;
  agingHref?: string;
  reportPermission?: string;
}) {
  const can = useCan();
  const canReports = reportPermission ? can(reportPermission) : false;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {isLoading ? (
          <Skeleton className="h-16 w-full" />
        ) : summary ? (
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Balance due</dt>
              <dd className="font-medium tabular-nums">
                {formatMoney(summary.balance_due, currencyCode)}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Overdue</dt>
              <dd className="tabular-nums">{formatMoney(summary.overdue, currencyCode)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Unapplied credits</dt>
              <dd className="tabular-nums">
                {formatMoney(summary.unapplied_credits, currencyCode)}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Credit limit</dt>
              <dd className="tabular-nums">
                {summary.credit_limit == null
                  ? "Unlimited"
                  : formatMoney(summary.credit_limit, currencyCode)}
              </dd>
            </div>
            {summary.available_credit != null ? (
              <div>
                <dt className="text-muted-foreground">Available credit</dt>
                <dd className="tabular-nums">
                  {formatMoney(summary.available_credit, currencyCode)}
                </dd>
              </div>
            ) : null}
          </dl>
        ) : (
          <p className="text-muted-foreground text-sm">Outstanding figures are not available.</p>
        )}
        {canReports && (statementHref || agingHref) ? (
          <div className="flex flex-wrap gap-3 text-sm">
            {statementHref ? (
              <Link href={statementHref} className="underline-offset-4 hover:underline">
                View statement
              </Link>
            ) : null}
            {agingHref ? (
              <Link href={agingHref} className="underline-offset-4 hover:underline">
                View aging
              </Link>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
