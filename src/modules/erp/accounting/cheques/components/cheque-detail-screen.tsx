"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { useChequeWorkflow, useDeleteCheque } from "@/modules/erp/accounting/cheques/mutations";
import { chequePermissions } from "@/modules/erp/accounting/cheques/permissions";
import { useCheque } from "@/modules/erp/accounting/cheques/queries";
import { getErrorMessage } from "@/shared/api/errors";
import { useCrudPermissions } from "@/shared/auth/use-crud-permissions";
import { ConfirmActionDialog } from "@/shared/components/feedback/confirm-action-dialog";
import { ListPage } from "@/shared/components/layout/list-page";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Skeleton } from "@/shared/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { formatDate } from "@/shared/lib/format";

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
  const cheque = query.data;
  const [pendingAction, setPendingAction] = useState<"bounce" | "cancel" | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [reason, setReason] = useState("");

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
    return <Skeleton className="h-64 w-full" />;
  }

  if (!cheque) {
    return null;
  }

  return (
    <ListPage>
      <PageHeader
        title={`Cheque ${cheque.cheque_number}`}
        subtitle={`${cheque.direction} · ${cheque.document_number}`}
        actions={
          <div className="flex flex-wrap gap-2">
            {cheque.status === "DRAFT" && canUpdate ? (
              <Button variant="outline" asChild>
                <Link href={`/cheques/${cheque.id}/edit`}>Edit</Link>
              </Button>
            ) : null}
            {cheque.status === "DRAFT" && canDelete ? (
              <Button variant="outline" onClick={() => setConfirmDelete(true)}>
                Delete
              </Button>
            ) : null}
            {cheque.available_actions.map((action) => (
              <Button key={action} variant="outline" onClick={() => runAction(action)}>
                {ACTION_LABELS[action] ?? action}
              </Button>
            ))}
          </div>
        }
      />
      <div className="grid gap-4 rounded-lg border p-4 md:grid-cols-2">
        <div>
          <div className="text-muted-foreground text-sm">Status</div>
          <Badge variant="outline">{cheque.status}</Badge>
        </div>
        <div>
          <div className="text-muted-foreground text-sm">Amount</div>
          <div className="text-lg font-semibold">{cheque.amount}</div>
        </div>
        <div>
          <div className="text-muted-foreground text-sm">Cheque date</div>
          <div>{cheque.cheque_date}</div>
        </div>
        <div>
          <div className="text-muted-foreground text-sm">Due date</div>
          <div>{cheque.due_date ?? "—"}</div>
        </div>
        <div>
          <div className="text-muted-foreground text-sm">Unapplied</div>
          <div>{cheque.amount_unapplied}</div>
        </div>
        <div>
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
        <div className="rounded-lg border p-4">
          <h2 className="mb-3 text-lg font-semibold">Allocations</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Document</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cheque.allocations.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.item_document_number ?? row.item_id}</TableCell>
                  <TableCell>{row.item_type}</TableCell>
                  <TableCell>{row.amount}</TableCell>
                  <TableCell>
                    {row.reversed_at ? (
                      <Badge variant="secondary">Reversed {formatDate(row.reversed_at)}</Badge>
                    ) : (
                      <Badge variant="outline">Applied</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
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
      <Dialog
        open={Boolean(pendingAction)}
        onOpenChange={(open) => !open && setPendingAction(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {pendingAction === "bounce" ? "Bounce cheque" : "Cancel cheque"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="cheque-reason">Reason</Label>
            <Input
              id="cheque-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Optional reason"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingAction(null)}>
              Back
            </Button>
            <Button onClick={() => void confirmReasonAction()}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ListPage>
  );
}
