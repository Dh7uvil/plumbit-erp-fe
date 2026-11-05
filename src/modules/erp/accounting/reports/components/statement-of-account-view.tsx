"use client";

import { type ReactNode } from "react";

import { RecordLink } from "@/shared/components/data-table/record-link";
import { DataTable } from "@/shared/components/data-table/data-table";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { formatBalanceWithSide, formatDate, formatReportMoney } from "@/shared/lib/format";

export type StatementOfAccountRow = {
  key: string;
  date: string;
  refNo: string;
  refHref?: string | null;
  dateHref?: string | null;
  typeCode: string;
  debit: string;
  credit: string;
  runningBalance: string;
  balanceSide?: string | null;
  chequeNumber?: string | null;
  chequeDate?: string | null;
  chequeClearingDate?: string | null;
};

export type StatementOfAccountHeader = {
  accountCode: string | null;
  accountName: string | null;
  from: string;
  to: string;
  pdcIncluded: boolean;
  previousBalanceIncluded: boolean;
  currencyCode: string | null;
};

export type StatementOfAccountTotals = {
  totalDebit: string | null | undefined;
  totalCredit: string | null | undefined;
  closingBalance: string | null | undefined;
  closingBalanceSide?: string | null;
};

const COLUMN_COUNT = 8;

function formatChequeDateColumn(
  chequeDate: string | null | undefined,
  clearingDate: string | null | undefined,
): string {
  const parts: string[] = [];
  if (chequeDate) {
    parts.push(formatDate(chequeDate));
  }
  if (clearingDate && clearingDate !== chequeDate) {
    parts.push(formatDate(clearingDate));
  }
  return parts.length > 0 ? parts.join(" / ") : "—";
}

export function StatementOfAccountHeaderBand({ header }: { header: StatementOfAccountHeader }) {
  const items = [
    { label: "Account", value: header.accountCode ?? "—" },
    { label: "Name", value: header.accountName ?? "—" },
    { label: "From", value: formatDate(header.from) },
    { label: "To", value: formatDate(header.to) },
    {
      label: "P.D.C Statement",
      value: header.pdcIncluded ? "Included" : "Excluded",
    },
    {
      label: "Previous Balance",
      value: header.previousBalanceIncluded ? "Included" : "Excluded",
    },
    { label: "Currency", value: header.currencyCode ?? "—" },
  ];
  return (
    <div className="bg-muted/30 grid gap-3 rounded-md border p-3 text-sm sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
      {items.map((item) => (
        <div key={item.label} className="min-w-0">
          <p className="text-muted-foreground text-xs">{item.label}</p>
          <p className="truncate font-medium">{item.value}</p>
        </div>
      ))}
    </div>
  );
}

type StatementOfAccountTableProps = {
  header: StatementOfAccountHeader;
  openingRow?: StatementOfAccountRow | null;
  rows: StatementOfAccountRow[];
  totals: StatementOfAccountTotals | null;
  tableFooter?: ReactNode;
  emptyBody?: ReactNode;
};

export function StatementOfAccountTable({
  header,
  openingRow,
  rows,
  totals,
  tableFooter,
  emptyBody,
}: StatementOfAccountTableProps) {
  const money = (value: string | null | undefined) =>
    formatReportMoney(value, header.currencyCode);

  const hasLines = Boolean(openingRow) || rows.length > 0;

  return (
    <div className="space-y-4">
      <StatementOfAccountHeaderBand header={header} />
      <DataTable footer={tableFooter}>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Ref. No.</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Debit</TableHead>
            <TableHead>Credit</TableHead>
            <TableHead>Balance</TableHead>
            <TableHead>Cheque No</TableHead>
            <TableHead>Chq. Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {emptyBody}
          {openingRow ? (
            <TableRow className="bg-muted/40">
              <TableCell>{formatDate(openingRow.date)}</TableCell>
              <TableCell>{openingRow.refNo}</TableCell>
              <TableCell>{openingRow.typeCode}</TableCell>
              <TableCell>{money(openingRow.debit)}</TableCell>
              <TableCell>{money(openingRow.credit)}</TableCell>
              <TableCell>
                {formatBalanceWithSide(
                  openingRow.runningBalance,
                  openingRow.balanceSide,
                  header.currencyCode,
                )}
              </TableCell>
              <TableCell>{openingRow.chequeNumber ?? "—"}</TableCell>
              <TableCell>
                {formatChequeDateColumn(openingRow.chequeDate, undefined)}
              </TableCell>
            </TableRow>
          ) : null}
          {rows.map((row) => (
            <StatementDataRow key={row.key} row={row} currencyCode={header.currencyCode} />
          ))}
          {totals && hasLines ? (
            <>
              <TableRow className="bg-muted/30 font-medium">
                <TableCell colSpan={3}>Total</TableCell>
                <TableCell>{money(totals.totalDebit)}</TableCell>
                <TableCell>{money(totals.totalCredit)}</TableCell>
                <TableCell colSpan={3} />
              </TableRow>
              <TableRow className="bg-muted/30 font-medium">
                <TableCell colSpan={5}>Balance</TableCell>
                <TableCell>
                  {formatBalanceWithSide(
                    totals.closingBalance,
                    totals.closingBalanceSide,
                    header.currencyCode,
                  )}
                </TableCell>
                <TableCell colSpan={2} />
              </TableRow>
            </>
          ) : null}
        </TableBody>
      </DataTable>
    </div>
  );
}

function StatementDataRow({
  row,
  currencyCode,
}: {
  row: StatementOfAccountRow;
  currencyCode: string | null;
}) {
  const money = (value: string) => formatReportMoney(value, currencyCode);
  return (
    <TableRow>
      <TableCell>
        {row.dateHref ? (
          <RecordLink href={row.dateHref}>{formatDate(row.date)}</RecordLink>
        ) : (
          formatDate(row.date)
        )}
      </TableCell>
      <TableCell>
        {row.refHref ? (
          <RecordLink href={row.refHref}>{row.refNo}</RecordLink>
        ) : (
          row.refNo
        )}
      </TableCell>
      <TableCell>{row.typeCode}</TableCell>
      <TableCell>{money(row.debit)}</TableCell>
      <TableCell>{money(row.credit)}</TableCell>
      <TableCell>
        {formatBalanceWithSide(row.runningBalance, row.balanceSide, currencyCode)}
      </TableCell>
      <TableCell>{row.chequeNumber ?? "—"}</TableCell>
      <TableCell>{formatChequeDateColumn(row.chequeDate, row.chequeClearingDate)}</TableCell>
    </TableRow>
  );
}
