"use client";

import { useState } from "react";

import { useQuotationRevision, useQuotationRevisions } from "@/modules/erp/quotations/queries";
import {
  QUOTATION_STATUS_LABELS,
  type Quotation,
  type QuotationRevision,
  type QuotationRevisionListItem,
  type QuotationStatus,
} from "@/modules/erp/quotations/schemas";
import { userPermissions } from "@/modules/users-management/users/permissions";
import { useAllUsers } from "@/modules/users-management/users/queries";
import { DataTable } from "@/shared/components/data-table/data-table";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Skeleton } from "@/shared/components/ui/skeleton";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { formatDateTime, formatMoney } from "@/shared/lib/format";
import { useCan } from "@/shared/providers/session-provider";

const HEADER_LABELS: Record<string, string> = {
  quote_number: "Quote number",
  status: "Status",
  version: "Version",
  quote_date: "Quote date",
  valid_until: "Valid until",
  branch: "Branch",
  customer: "Customer",
  contact: "Contact",
  tax_treatment: "Tax treatment",
  place_of_supply: "Place of supply",
  currency: "Currency",
  exchange_rate: "Exchange rate",
  price_list: "Price list",
  payment_terms: "Payment terms",
  salesperson: "Salesperson",
  discount_type: "Discount type",
  discount_value: "Discount value",
  discount_amount: "Discount amount",
  shipping_amount: "Shipping",
  adjustment_amount: "Adjustment",
  subtotal: "Subtotal",
  tax_amount: "Tax",
  grand_total: "Grand total",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function formatSnapshotValue(value: unknown): string {
  if (value === null || value === undefined || value === "") {
    return "—";
  }
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return JSON.stringify(value);
}

export function QuotationRevisionsPanel({ quotation }: { quotation: Quotation }) {
  const can = useCan();
  const revisionCount = quotation.revision_count ?? 0;
  const revisionsQuery = useQuotationRevisions(quotation.id, revisionCount > 0);
  const usersQuery = useAllUsers(can(userPermissions.read));
  const [selected, setSelected] = useState<number | null>(null);
  const revisionQuery = useQuotationRevision(quotation.id, selected);

  if (revisionCount === 0) {
    return null;
  }

  const rows = revisionsQuery.data ?? [];
  const users = usersQuery.data ?? [];
  const userNameById = new Map(users.map((user) => [user.id, user.name]));

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Revision history</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable>
            <TableHeader>
              <TableRow>
                <TableHead>Revision</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Revised by</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead className="text-right">Grand total</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {revisionsQuery.isLoading ? (
                <TableRow>
                  <TableCell colSpan={6}>
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => (
                  <RevisionRow
                    key={row.id}
                    row={row}
                    revisedBy={row.revised_by ? (userNameById.get(row.revised_by) ?? "—") : "—"}
                    onView={() => setSelected(row.revision_number)}
                  />
                ))
              )}
            </TableBody>
          </DataTable>
        </CardContent>
      </Card>
      <RevisionSnapshotDialog
        open={selected !== null}
        revision={revisionQuery.data ?? null}
        isLoading={revisionQuery.isLoading}
        onOpenChange={(open) => {
          if (!open) {
            setSelected(null);
          }
        }}
      />
    </>
  );
}

function RevisionRow({
  row,
  revisedBy,
  onView,
}: {
  row: QuotationRevisionListItem;
  revisedBy: string;
  onView: () => void;
}) {
  const statusLabel =
    row.status_at_revision in QUOTATION_STATUS_LABELS
      ? QUOTATION_STATUS_LABELS[row.status_at_revision as QuotationStatus]
      : row.status_at_revision;
  return (
    <TableRow>
      <TableCell className="font-mono text-sm">R{row.revision_number}</TableCell>
      <TableCell>{formatDateTime(row.revised_at)}</TableCell>
      <TableCell>{revisedBy}</TableCell>
      <TableCell className="max-w-xs truncate" title={row.revision_reason}>
        {row.revision_reason}
      </TableCell>
      <TableCell className="text-right tabular-nums">
        {row.grand_total ? formatMoney(row.grand_total, "") : "—"}
        {statusLabel ? (
          <span className="text-muted-foreground mt-0.5 block text-xs">{statusLabel}</span>
        ) : null}
      </TableCell>
      <TableCell>
        <Button type="button" variant="outline" size="sm" onClick={onView}>
          View
        </Button>
      </TableCell>
    </TableRow>
  );
}

function RevisionSnapshotDialog({
  open,
  revision,
  isLoading,
  onOpenChange,
}: {
  open: boolean;
  revision: QuotationRevision | null;
  isLoading: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const header = revision && isRecord(revision.header) ? revision.header : {};
  const lines = revision?.lines ?? [];
  const currency = typeof header.currency === "string" ? header.currency : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {revision ? `Revision R${revision.revision_number}` : "Revision"}
          </DialogTitle>
          <DialogDescription>
            {revision
              ? `Snapshot of ${revision.quote_number} before this revision.`
              : "Loading revision snapshot."}
          </DialogDescription>
        </DialogHeader>
        {isLoading || !revision ? (
          <Skeleton className="h-48 w-full" />
        ) : (
          <div className="flex flex-col gap-4">
            <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {Object.entries(HEADER_LABELS).map(([key, label]) =>
                key in header ? (
                  <div key={key} className="flex flex-col gap-0.5">
                    <dt className="text-muted-foreground text-xs">{label}</dt>
                    <dd className="text-sm">{formatSnapshotValue(header[key])}</dd>
                  </div>
                ) : null,
              )}
            </dl>
            <p className="text-sm font-medium">Lines</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="py-1.5 pr-2 font-medium">SKU</th>
                    <th className="py-1.5 pr-2 font-medium">Description</th>
                    <th className="py-1.5 pr-2 font-medium">Qty</th>
                    <th className="py-1.5 pr-2 font-medium">Rate</th>
                    <th className="py-1.5 text-right font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((line, index) => {
                    const row = isRecord(line) ? line : {};
                    return (
                      <tr key={index} className="border-b last:border-0">
                        <td className="py-1.5 pr-2 font-mono">
                          {formatSnapshotValue(row.product_sku ?? row.sku)}
                        </td>
                        <td className="py-1.5 pr-2">
                          {formatSnapshotValue(row.product_name ?? row.description)}
                        </td>
                        <td className="py-1.5 pr-2">{formatSnapshotValue(row.quantity)}</td>
                        <td className="py-1.5 pr-2">{formatSnapshotValue(row.rate)}</td>
                        <td className="py-1.5 text-right tabular-nums">
                          {typeof row.amount === "string"
                            ? formatMoney(row.amount, currency)
                            : formatSnapshotValue(row.amount)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="text-muted-foreground text-sm">{revision.revision_reason}</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
