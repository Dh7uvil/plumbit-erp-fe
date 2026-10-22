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

function money(value: string | null | undefined, currencyCode: string) {
  if (value == null || value === "") {
    return "—";
  }
  return formatMoney(value, currencyCode);
}

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
  const baseCode = baseCurrencyCode ?? "";
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
  const showLocalCurrency = rows.some(
    (row) => row.currency_code && baseCode && row.currency_code !== baseCode,
  );
  return (
    <div className="bg-background overflow-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Document</TableHead>
            <TableHead>Supplier</TableHead>
            <TableHead className="text-right">Qty</TableHead>
            <TableHead className="text-right">
              {kind === "IMPORT" ? "Rate (FCY)" : "Price"}
            </TableHead>
            <TableHead className="text-right">
              {kind === "IMPORT" ? "Amount (FCY)" : "Amount"}
            </TableHead>
            {kind === "IMPORT" || showLocalCurrency ? (
              <>
                <TableHead className="text-right">Rate (LCY)</TableHead>
                <TableHead className="text-right">Amount (LCY)</TableHead>
              </>
            ) : null}
            {kind === "IMPORT" ? (
              <TableHead>LC</TableHead>
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
          {rows.map((row) => {
            const billCurrency = row.currency_code || baseCode;
            const lcLabel = [row.lc_number, row.lc_date ? formatDate(row.lc_date) : null]
              .filter(Boolean)
              .join(" · ");
            const documentHref =
              row.document_type === "GOODS_RECEIPT"
                ? `/goods-receipts/${row.document_id}`
                : `/purchase-invoices/${row.document_id}`;
            return (
              <TableRow key={row.line_id}>
                <TableCell>{formatDate(row.document_date)}</TableCell>
                <TableCell>
                  <Link href={documentHref} className="underline-offset-4 hover:underline">
                    {row.document_number}
                  </Link>
                </TableCell>
                <TableCell>{row.party_name}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatFixedDecimal(row.quantity, 3)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {money(row.fc_rate ?? row.rate, billCurrency)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {money(row.amount, billCurrency)}
                </TableCell>
                {kind === "IMPORT" || showLocalCurrency ? (
                  <>
                    <TableCell className="text-right tabular-nums">
                      {money(row.rate_lcy, baseCode)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {money(row.amount_lcy, baseCode)}
                    </TableCell>
                  </>
                ) : null}
                {kind === "IMPORT" ? (
                  <TableCell className="text-sm">{lcLabel || "—"}</TableCell>
                ) : (
                  <>
                    <TableCell className="text-sm">{row.supplier_invoice_number ?? "—"}</TableCell>
                    <TableCell>{row.warehouse_name ?? "—"}</TableCell>
                  </>
                )}
                <TableCell>{row.is_posted ? "Yes" : "No"}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
