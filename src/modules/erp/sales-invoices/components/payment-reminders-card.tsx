"use client";

import { dunningPermissions } from "@/modules/erp/accounting/dunning-rules/permissions";
import { usePaymentReminders } from "@/modules/erp/accounting/dunning-rules/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { formatDateTime } from "@/shared/lib/format";
import { useCan } from "@/shared/providers/session-provider";

export function PaymentRemindersCard({ salesInvoiceId }: { salesInvoiceId: string }) {
  const can = useCan();
  const enabled = can(dunningPermissions.read);
  const query = usePaymentReminders(salesInvoiceId, enabled);
  const rows = query.data ?? [];

  if (!enabled) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Payment reminders</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 text-sm">
        {query.isLoading ? (
          <p className="text-muted-foreground">Loading reminder history…</p>
        ) : rows.length === 0 ? (
          <p className="text-muted-foreground">No reminders sent for this invoice yet.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {rows.map((log) => (
              <li key={log.id} className="flex flex-wrap items-center gap-2">
                <span className="font-medium">{log.dunning_rule_name ?? "Reminder"}</span>
                <span className="text-muted-foreground">{formatDateTime(log.sent_at)}</span>
                {log.recipient_email ? (
                  <span className="text-muted-foreground">→ {log.recipient_email}</span>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
