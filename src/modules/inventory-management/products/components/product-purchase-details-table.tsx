"use client";

import Link from "next/link";

import type { ProductPurchaseDetailLine } from "@/modules/inventory-management/products/schemas";
import { getErrorMessage } from "@/shared/api/errors";
import { DataTableError } from "@/shared/components/data-table/states";
import { Skeleton } from "@/shared/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { useBaseCurrency } from "@/shared/hooks/use-base-currency";
import { formatDate, formatFixedDecimal, formatMoney } from "@/shared/lib/format";

export function ProductPurchaseDetailsTable({
  rows,
  isLoading,
  isError,
  error,
  onRetry,
  kind,
}: {
  rows: ProductPurchaseDetailLine[];
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  onRetry: () => void;
  kind: "LOCAL" | "IMPORT";
}) {
  const { baseCurrencyCode } = useBaseCurrency();
  if (isLoading) {
    return <Skeleton className="h-40 w-full" />;
  }
  if (isError) {
    return <DataTableError message={getErrorMessage(error)} onRetry={onRetry} />;
  }
  if (rows.length === 0) {
    return (
      <div className="text-muted-foreground bg-muted/15 rounded-lg border px-4 py-8 text-center text-sm">
        No purchase lines for this filter.
      </div>
    );
  }
  return (
    <div className="overflow-auto rounded-lg border bg-background">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Invoice no.</TableHead>
            <TableHead>Supplier</TableHead>
            <TableHead className="text-right">Qty</TableHead>
            <TableHead className="text-right">Price</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            {kind === "IMPORT" ? (
              <>
                <TableHead className="text-right">Rate LCY</TableHead>
                <TableHead>LC</TableHead>
              </>
            ) : (
              <>
                <TableHead>Sup. invoice</TableHead>
                <TableHead>Warehouse</TableHead>
              </>
            )}
            <TableHead>Posted</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={`${row.document_id}-${row.document_date}-${row.rate}`}>
              <TableCell>{formatDate(row.document_date)}</TableCell>
              <TableCell>
                <Link
                  href={`/purchase-invoices/${row.document_id}`}
                  className="underline-offset-4 hover:underline"
                >
                  {row.document_number}
                </Link>
              </TableCell>
              <TableCell>{row.party_name}</TableCell>
              <TableCell className="text-right tabular-nums">
                {formatFixedDecimal(row.quantity, 3)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatMoney(row.rate, baseCurrencyCode ?? "")}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatMoney(row.amount, baseCurrencyCode ?? "")}
              </TableCell>
              {kind === "IMPORT" ? (
                <>
                  <TableCell className="text-right tabular-nums">
                    {row.rate_lcy ? formatMoney(row.rate_lcy, baseCurrencyCode ?? "") : "—"}
                  </TableCell>
                  <TableCell className="text-sm">
                    {[row.lc_number, row.lc_date ? formatDate(row.lc_date) : null]
                      .filter(Boolean)
                      .join(" · ") || "—"}
                  </TableCell>
                </>
              ) : (
                <>
                  <TableCell className="text-sm">{row.supplier_invoice_number ?? "—"}</TableCell>
                  <TableCell>{row.warehouse_name ?? "—"}</TableCell>
                </>
              )}
              <TableCell>{row.is_posted ? "Yes" : "No"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
