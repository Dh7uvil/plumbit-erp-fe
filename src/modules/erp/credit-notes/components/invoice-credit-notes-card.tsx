"use client";

import Link from "next/link";

import { creditNotePermissions } from "@/modules/erp/credit-notes/permissions";
import { useCreditNotes } from "@/modules/erp/credit-notes/queries";
import {
  CREDIT_NOTE_REASON_LABELS,
  INVOICE_DOCUMENT_STATUS_LABELS,
  INVOICE_DOCUMENT_STATUS_VARIANTS,
  creditNoteDisplayNumber,
} from "@/modules/erp/credit-notes/schemas";
import { DocumentStatusBadge } from "@/shared/components/document/document-status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { formatDate } from "@/shared/lib/format";
import { useCan } from "@/shared/providers/session-provider";

export function InvoiceCreditNotesCard({ salesInvoiceId }: { salesInvoiceId: string }) {
  const can = useCan();
  const enabled = can(creditNotePermissions.read);
  const query = useCreditNotes({ sales_invoice_id: salesInvoiceId, page_size: 100 }, enabled);
  const rows = query.data?.data ?? [];

  if (!enabled) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Credit notes</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 text-sm">
        {query.isLoading ? (
          <p className="text-muted-foreground">Loading credit notes…</p>
        ) : rows.length === 0 ? (
          <p className="text-muted-foreground">No credit notes against this invoice.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {rows.map((note) => (
              <li key={note.id} className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/credit-notes/${note.id}`}
                  className="text-foreground underline-offset-4 hover:underline"
                >
                  {creditNoteDisplayNumber(note) ?? "Credit note"}
                </Link>
                <DocumentStatusBadge
                  status={note.status}
                  labels={INVOICE_DOCUMENT_STATUS_LABELS}
                  variants={INVOICE_DOCUMENT_STATUS_VARIANTS}
                />
                <span className="text-muted-foreground">
                  {CREDIT_NOTE_REASON_LABELS[note.reason_code]} · {formatDate(note.credit_note_date)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
