"use client";

import Link from "next/link";

import { OPEN_ITEM_TYPE_LABELS, type OpenItemType } from "@/shared/components/document/schemas";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { Button } from "@/shared/components/ui/button";
import { formatDateTime, formatMoney } from "@/shared/lib/format";

const SUBLEDGER_NOTE_TYPES = new Set(["CREDIT_NOTE", "DEBIT_NOTE"]);

export type PaymentAllocationHistoryRow = {
  id: string;
  item_type: OpenItemType | string;
  item_id: string;
  item_document_number?: string | null;
  amount: string;
  journal_entry_id?: string | null;
  reversed_at?: string | null;
  created_at?: string | null;
};

function journalLabel(row: PaymentAllocationHistoryRow): string {
  if (row.journal_entry_id) {
    return "journal";
  }
  if (SUBLEDGER_NOTE_TYPES.has(String(row.item_type))) {
    return "subledger";
  }
  return "none";
}

export function PaymentAllocationHistoryTable({
  rows,
  currencyCode,
  onUnapply,
  unapplyPendingId,
  canUnapply = false,
}: {
  rows: readonly PaymentAllocationHistoryRow[];
  currencyCode: string;
  onUnapply?: (row: PaymentAllocationHistoryRow) => void;
  unapplyPendingId?: string | null;
  canUnapply?: boolean;
}) {
  if (rows.length === 0) {
    return <p className="text-muted-foreground text-sm">No allocation history yet.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Document</TableHead>
          <TableHead className="text-right">Amount</TableHead>
          <TableHead>Journal</TableHead>
          <TableHead>Status</TableHead>
          {canUnapply && onUnapply ? <TableHead className="text-right">Action</TableHead> : null}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => {
          const live = !row.reversed_at;
          const journalId = row.journal_entry_id;
          const journalKind = journalLabel(row);
          return (
            <TableRow key={row.id}>
              <TableCell>
                <div className="flex flex-col">
                  <span className="text-muted-foreground text-xs">
                    {OPEN_ITEM_TYPE_LABELS[row.item_type as OpenItemType] ?? row.item_type}
                  </span>
                  <span>{row.item_document_number ?? row.item_id.slice(0, 8)}</span>
                  {row.created_at ? (
                    <span className="text-muted-foreground text-xs">
                      {formatDateTime(row.created_at)}
                    </span>
                  ) : null}
                </div>
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatMoney(row.amount, currencyCode)}
              </TableCell>
              <TableCell>
                {journalKind === "journal" && journalId ? (
                  <Link href={`/journals/${journalId}`} className="underline-offset-4 hover:underline">
                    View journal
                  </Link>
                ) : journalKind === "subledger" ? (
                  <span className="text-muted-foreground text-sm">Subledger (no journal)</span>
                ) : (
                  "—"
                )}
              </TableCell>
              <TableCell>
                {live
                  ? journalKind === "subledger"
                    ? "Netted"
                    : "Applied"
                  : "Reversed"}
              </TableCell>
              {canUnapply && onUnapply ? (
                <TableCell className="text-right">
                  {live && journalId ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={unapplyPendingId === row.id}
                      onClick={() => onUnapply(row)}
                    >
                      Unapply
                    </Button>
                  ) : null}
                </TableCell>
              ) : null}
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
