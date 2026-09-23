"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import {
  CHEQUE_STATUS_LABELS,
  CHEQUE_STATUS_VARIANTS,
} from "@/modules/erp/accounting/cheques/components/cheque-columns";
import { useChequeWorkflow, useDeleteCheque } from "@/modules/erp/accounting/cheques/mutations";
import { chequePermissions } from "@/modules/erp/accounting/cheques/permissions";
import { useCheque } from "@/modules/erp/accounting/cheques/queries";
import { useAllCurrencies } from "@/modules/erp/currencies/queries";
import { getErrorMessage } from "@/shared/api/errors";
import { useCrudPermissions } from "@/shared/auth/use-crud-permissions";
import { DataTableError } from "@/shared/components/data-table/states";
import { DocumentStatusBadge } from "@/shared/components/document/document-status-badge";
import { ConfirmActionDialog } from "@/shared/components/feedback/confirm-action-dialog";
import { RecordPageHeader } from "@/shared/components/layout/record-page-header";
import { MoneyWithBase } from "@/shared/components/money";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
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
import { formatDate, formatMoney, humanizeEnum } from "@/shared/lib/format";

const ACTION_LABELS: Record<string, string> = {
  issue: "Issue",
  deposit: "Deposit",
  clear: "Clear",
  bounce: "Bounce",
  cancel: "Cancel",
};

export function ChequeDetailScreen({ id }: { id: string }) {
  const router = useRouter();
  const { canUpdate, canDelete } = useCrudPermissions(chequePermissions);
  const query = useCheque(id);
  const workflow = useChequeWorkflow();
  const deleteCheque = useDeleteCheque();
  const currenciesQuery = useAllCurrencies();
  const { baseCurrencyCode } = useBaseCurrency();
  const cheque = query.data;
  const [pendingAction, setPendingAction] = useState<"bounce" | "cancel" | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [reason, setReason] = useState("");
  const currencyCode = useMemo(() => {
    if (!cheque) {
      return "";
    }
    return (
      currenciesQuery.data?.find((currency) => currency.id === cheque.currency_id)?.code ?? ""
    );
  }, [cheque, currenciesQuery.data]);

  async function runAction(action: string) {
    if (!cheque) return;
    if (action === "bounce" || action === "cancel") {
      setPendingAction(action);
      setReason("");
      return;
    }
    try {
      if (action === "issue") {
        await workflow.issue.mutateAsync({ id, version: cheque.version });
      } else if (action === "deposit") {
        await workflow.deposit.mutateAsync({ id, version: cheque.version });
      } else if (action === "clear") {
        await workflow.clear.mutateAsync({ id, version: cheque.version });
      }
      toast.success(`${ACTION_LABELS[action] ?? action} completed`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  async function confirmReasonAction() {
    if (!cheque || !pendingAction) return;
    try {
      if (pendingAction === "bounce") {
        await workflow.bounce.mutateAsync({
          id,
          payload: { reason: reason.trim() || null, version: cheque.version },
        });
      } else {
        await workflow.cancel.mutateAsync({
          id,
          payload: { reason: reason.trim() || null, version: cheque.version },
        });
      }
      toast.success(`${ACTION_LABELS[pendingAction]} completed`);
      setPendingAction(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  if (query.isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (query.isError || !cheque) {
    return (
      <div className="flex flex-col gap-3">
        <DataTableError
          message={getErrorMessage(query.error)}
          onRetry={() => query.refetch()}
        />
        <Button type="button" variant="outline" asChild>
          <Link href="/cheques">Back to cheques</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <RecordPageHeader
        title={cheque.cheque_number}
        subtitle={`${humanizeEnum(cheque.direction)} · ${cheque.document_number}`}
        code={cheque.document_number}
        listHref="/cheques"
        viewHref={`/cheques/${cheque.id}`}
        editHref={cheque.status === "DRAFT" && canUpdate ? `/cheques/${cheque.id}/edit` : undefined}
        canUpdate={cheque.status === "DRAFT" && canUpdate}
        mode="view"
        badges={
          <DocumentStatusBadge
            status={cheque.status}
            labels={CHEQUE_STATUS_LABELS}
            variants={CHEQUE_STATUS_VARIANTS}
          />
        }
        extraActions={
          <div className="flex flex-wrap gap-2">
            {cheque.status === "DRAFT" && canDelete ? (
              <Button variant="outline" onClick={() => setConfirmDelete(true)}>
                Delete
              </Button>
            ) : null}
            {cheque.available_actions.map((action) => (
              <Button key={action} variant="outline" onClick={() => void runAction(action)}>
                {ACTION_LABELS[action] ?? action}
              </Button>
            ))}
          </div>
        }
      />
      <div className="grid gap-4 rounded-lg border p-4 md:grid-cols-2">
        <div>
          <div className="text-muted-foreground text-sm">Amount</div>
          <MoneyWithBase
            amount={cheque.amount}
            currencyCode={currencyCode}
            baseAmount={cheque.base_amount}
            baseCurrencyCode={baseCurrencyCode}
            className="text-lg font-semibold"
          />
        </div>
        <div>
          <div className="text-muted-foreground text-sm">Unapplied</div>
          <div className="text-lg font-semibold tabular-nums">
            {formatMoney(cheque.amount_unapplied, currencyCode)}
          </div>
        </div>
        <div>
          <div className="text-muted-foreground text-sm">Cheque date</div>
          <div>{formatDate(cheque.cheque_date)}</div>
        </div>
        <div>
          <div className="text-muted-foreground text-sm">Due date</div>
          <div>{formatDate(cheque.due_date ?? cheque.cheque_date)}</div>
        </div>
        <div className="md:col-span-2">
          <div className="text-muted-foreground text-sm">Narration</div>
          <div>{cheque.narration ?? "—"}</div>
        </div>
        {cheque.bounce_reason ? (
          <div className="md:col-span-2">
            <div className="text-muted-foreground text-sm">Bounce reason</div>
            <div>{cheque.bounce_reason}</div>
          </div>
        ) : null}
      </div>
      {cheque.allocations.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Allocations</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Document</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cheque.allocations.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.item_document_number ?? row.item_id}</TableCell>
                    <TableCell>{humanizeEnum(row.item_type)}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatMoney(row.amount, currencyCode)}
                    </TableCell>
                    <TableCell>
                      {row.reversed_at ? (
                        <Badge variant="secondary">
                          Reversed {formatDate(row.reversed_at)}
                        </Badge>
                      ) : (
                        <Badge variant="outline">Applied</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : null}
      <ConfirmActionDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete cheque"
        description="This removes the draft cheque register entry."
        confirmLabel="Delete"
        onConfirm={async () => {
          try {
            await deleteCheque.mutateAsync({ id: cheque.id, version: cheque.version });
            toast.success("Cheque deleted");
            router.push("/cheques");
          } catch (error) {
            toast.error(getErrorMessage(error));
          }
        }}
      />
      <ConfirmActionDialog
        open={Boolean(pendingAction)}
        onOpenChange={(open) => !open && setPendingAction(null)}
        title={pendingAction === "bounce" ? "Bounce cheque" : "Cancel cheque"}
        description="Optionally record a reason for this action."
        confirmLabel="Confirm"
        extra={
          <div className="space-y-2 py-2">
            <Label htmlFor="cheque-reason">Reason</Label>
            <Input
              id="cheque-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Optional reason"
            />
          </div>
        }
        onConfirm={() => void confirmReasonAction()}
      />
    </div>
  );
}
