"use client";

import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { formatDate, formatMoney } from "@/shared/lib/format";
import type { PartyPaymentHistoryItem } from "@/shared/components/document/schemas";

export type PartyPaymentHistoryRow = {
  id: string;
  document_number: string;
  payment_date: string;
  amount: string;
  status: string;
  href: string;
};

export function toPartyPaymentHistoryRows(
  items: PartyPaymentHistoryItem[],
  hrefFor: (id: string) => string,
  amountKey: "amount_received" | "amount_paid",
): PartyPaymentHistoryRow[] {
  return items.map((item) => ({
    id: item.id,
    document_number: item.display_number || item.document_number || "Payment",
    payment_date: item.payment_date,
    amount: (amountKey === "amount_received" ? item.amount_received : item.amount_paid) ?? "0",
    status: item.status,
    href: hrefFor(item.id),
  }));
}

export function PartyPaymentHistoryCard({
  title = "Payment history",
  rows,
  currencyCode,
  isLoading = false,
}: {
  title?: string;
  rows: PartyPaymentHistoryRow[];
  currencyCode: string;
  isLoading?: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-16 w-full" />
        ) : rows.length === 0 ? (
          <p className="text-muted-foreground text-sm">No posted payments yet.</p>
        ) : (
          <ul className="flex flex-col gap-2 text-sm">
            {rows.map((row) => (
              <li key={row.id} className="flex flex-wrap items-baseline justify-between gap-2">
                <Link href={row.href} className="font-mono underline-offset-4 hover:underline">
                  {row.document_number || "Payment"}
                </Link>
                <span className="text-muted-foreground">{formatDate(row.payment_date)}</span>
                <span className="tabular-nums">{formatMoney(row.amount, currencyCode)}</span>
                <span className="text-muted-foreground">{row.status.replaceAll("_", " ")}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
