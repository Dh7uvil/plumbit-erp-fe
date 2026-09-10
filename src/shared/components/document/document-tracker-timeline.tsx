"use client";

import Link from "next/link";
import { useMemo } from "react";

import { DocumentStatusBadge } from "@/shared/components/document/document-status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { formatDate } from "@/shared/lib/format";

export type OrderTrackerRow = {
  stage: string;
  document_type: string;
  document_number?: string | null;
  document_id?: string | null;
  status: string;
  document_date?: string | null;
  quantity_summary?: string | null;
};

const ORDER_TRACKER_STAGES = [
  { key: "PROFORMA_INVOICE", label: "Proforma invoice" },
  { key: "SALES_ORDER", label: "Sales order" },
  { key: "PURCHASE_ORDER", label: "Purchase orders" },
  { key: "GOODS_RECEIPT", label: "Goods receipts" },
  { key: "QUALITY_INSPECTION", label: "Quality inspections" },
  { key: "PACKAGE", label: "Packages" },
  { key: "DELIVERY_NOTE", label: "Delivery notes" },
  { key: "SHIPMENT", label: "Shipments" },
  { key: "SALES_INVOICE", label: "Sales invoices" },
  { key: "SALES_RETURN", label: "Sales returns" },
] as const;

const TRACKER_HREF: Record<string, (id: string) => string> = {
  PROFORMA_INVOICE: (id) => `/proforma-invoices/${id}`,
  SALES_ORDER: (id) => `/sales-orders/${id}`,
  PURCHASE_ORDER: (id) => `/purchase-orders/${id}`,
  GOODS_RECEIPT: (id) => `/goods-receipts/${id}`,
  QUALITY_INSPECTION: (id) => `/quality-inspections/${id}`,
  PACKAGE: (id) => `/packages/${id}`,
  DELIVERY_NOTE: (id) => `/delivery-notes/${id}`,
  SHIPMENT: (id) => `/shipments/${id}`,
  SALES_INVOICE: (id) => `/sales-invoices/${id}`,
  SALES_RETURN: (id) => `/sales-returns/${id}`,
  PURCHASE_INVOICE: (id) => `/purchase-invoices/${id}`,
  CREDIT_NOTE: (id) => `/credit-notes/${id}`,
  DEBIT_NOTE: (id) => `/debit-notes/${id}`,
};

function normalizeType(value: string): string {
  return value.trim().replace(/[\s-]+/g, "_").toUpperCase();
}

function stageLabel(key: string): string {
  const known = ORDER_TRACKER_STAGES.find((stage) => stage.key === key);
  if (known) {
    return known.label;
  }
  return key
    .toLowerCase()
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function rowHref(row: OrderTrackerRow): string | null {
  if (!row.document_id) {
    return null;
  }
  const builder = TRACKER_HREF[normalizeType(row.document_type)];
  return builder ? builder(row.document_id) : null;
}

function groupRows(rows: OrderTrackerRow[]): Array<{ key: string; rows: OrderTrackerRow[] }> {
  const byKey = new Map<string, OrderTrackerRow[]>();
  const extraKeys: string[] = [];
  for (const row of rows) {
    const key = normalizeType(row.document_type || row.stage);
    const list = byKey.get(key) ?? [];
    if (!byKey.has(key)) {
      extraKeys.push(key);
    }
    list.push(row);
    byKey.set(key, list);
  }
  const ordered: Array<{ key: string; rows: OrderTrackerRow[] }> = [];
  const seen = new Set<string>();
  for (const stage of ORDER_TRACKER_STAGES) {
    ordered.push({ key: stage.key, rows: byKey.get(stage.key) ?? [] });
    seen.add(stage.key);
  }
  for (const key of extraKeys) {
    if (!seen.has(key)) {
      ordered.push({ key, rows: byKey.get(key) ?? [] });
    }
  }
  return ordered;
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
};

const STATUS_VARIANTS: Record<string, "muted" | "warning" | "info" | "success" | "destructive" | "secondary"> = {
  PENDING: "muted",
};

export function DocumentTrackerTimeline({
  rows,
  isLoading = false,
  title = "Order tracker",
}: {
  rows: OrderTrackerRow[];
  isLoading?: boolean;
  title?: string;
}) {
  const groups = useMemo(() => groupRows(rows), [rows]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-2/3" />
          </div>
        ) : (
          <ol className="flex flex-col gap-3">
            {groups.map((group) => (
              <li key={group.key} className="border-border border-l-2 pl-3">
                <p className="text-sm font-medium">{stageLabel(group.key)}</p>
                {group.rows.length === 0 ? (
                  <div className="mt-1 flex items-center gap-2">
                    <DocumentStatusBadge
                      status="PENDING"
                      labels={STATUS_LABELS}
                      variants={STATUS_VARIANTS}
                    />
                    <span className="text-muted-foreground text-sm">Not started</span>
                  </div>
                ) : (
                  <ul className="mt-1 flex flex-col gap-1">
                    {group.rows.map((row, index) => {
                      const href = rowHref(row);
                      const number = row.document_number?.trim() || stageLabel(group.key);
                      return (
                        <li
                          key={`${row.document_id ?? group.key}-${index}`}
                          className="flex flex-wrap items-center gap-2 text-sm"
                        >
                          {href ? (
                            <Link
                              href={href}
                              className="text-foreground underline-offset-4 hover:underline"
                            >
                              {number}
                            </Link>
                          ) : (
                            <span>{number}</span>
                          )}
                          <span className="text-muted-foreground">{row.status.replace(/_/g, " ")}</span>
                          {row.document_date ? (
                            <span className="text-muted-foreground">{formatDate(row.document_date)}</span>
                          ) : null}
                          {row.quantity_summary ? (
                            <span className="text-muted-foreground">{row.quantity_summary}</span>
                          ) : null}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
