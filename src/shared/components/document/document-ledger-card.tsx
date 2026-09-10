"use client";

import Link from "next/link";

import { journalPermissions } from "@/modules/erp/accounting/journals/permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { useCan } from "@/shared/providers/session-provider";

export function DocumentLedgerCard({
  journalEntryId,
  reversalJournalEntryId,
}: {
  journalEntryId?: string | null;
  reversalJournalEntryId?: string | null;
}) {
  const can = useCan();
  if (!can(journalPermissions.read) || (!journalEntryId && !reversalJournalEntryId)) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Ledger</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-1 text-sm">
        {journalEntryId ? (
          <Link
            href={`/journals/${journalEntryId}`}
            className="text-foreground underline-offset-4 hover:underline"
          >
            View journal
          </Link>
        ) : null}
        {reversalJournalEntryId ? (
          <Link
            href={`/journals/${reversalJournalEntryId}`}
            className="text-foreground underline-offset-4 hover:underline"
          >
            View reversal journal
          </Link>
        ) : null}
      </CardContent>
    </Card>
  );
}
