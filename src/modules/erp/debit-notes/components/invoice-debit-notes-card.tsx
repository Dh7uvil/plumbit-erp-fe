"use client";

import Link from "next/link";

import { debitNotePermissions } from "@/modules/erp/debit-notes/permissions";
import { useDebitNotes } from "@/modules/erp/debit-notes/queries";
import {
  DEBIT_NOTE_REASON_LABELS,
  INVOICE_DOCUMENT_STATUS_LABELS,
  INVOICE_DOCUMENT_STATUS_VARIANTS,
  debitNoteDisplayNumber,
} from "@/modules/erp/debit-notes/schemas";
import { DocumentStatusBadge } from "@/shared/components/document/document-status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { formatDate } from "@/shared/lib/format";
import { useCan } from "@/shared/providers/session-provider";

export function InvoiceDebitNotesCard({ purchaseInvoiceId }: { purchaseInvoiceId: string }) {
  const can = useCan();
  const enabled = can(debitNotePermissions.read);
  const query = useDebitNotes({ purchase_invoice_id: purchaseInvoiceId, page_size: 100 }, enabled);
  const rows = query.data?.data ?? [];

  if (!enabled) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Debit notes</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 text-sm">
        {query.isLoading ? (
          <p className="text-muted-foreground">Loading debit notes…</p>
        ) : rows.length === 0 ? (
          <p className="text-muted-foreground">No debit notes against this bill.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {rows.map((note) => (
              <li key={note.id} className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/debit-notes/${note.id}`}
                  className="text-foreground underline-offset-4 hover:underline"
                >
                  {debitNoteDisplayNumber(note) ?? "Debit note"}
                </Link>
                <DocumentStatusBadge
                  status={note.status}
                  labels={INVOICE_DOCUMENT_STATUS_LABELS}
                  variants={INVOICE_DOCUMENT_STATUS_VARIANTS}
                />
                <span className="text-muted-foreground">
                  {DEBIT_NOTE_REASON_LABELS[note.reason_code]} · {formatDate(note.debit_note_date)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
