"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { useAllAccounts } from "@/modules/erp/accounting/accounts/queries";
import { useCreateContraJournal } from "@/modules/erp/accounting/journals/mutations";
import { getErrorMessage } from "@/shared/api/errors";
import { ConfirmActionDialog } from "@/shared/components/feedback/confirm-action-dialog";
import { MasterSelect } from "@/shared/components/form/master-select";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";

const CASH_BANK_SUBTYPES = new Set(["CASH", "BANK"]);

function ContraEntryDialogContent({
  open,
  onOpenChange,
  defaultBookKind = "cash",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultBookKind?: "cash" | "bank";
}) {
  const router = useRouter();
  const createContra = useCreateContraJournal();
  const accountsQuery = useAllAccounts({ is_group: false });
  const cashBankAccounts = (accountsQuery.data ?? []).filter((row) =>
    CASH_BANK_SUBTYPES.has(row.account_subtype),
  );
  const defaultSource =
    cashBankAccounts.find(
      (row) => row.account_subtype === (defaultBookKind === "cash" ? "CASH" : "BANK"),
    )?.id ?? "";
  const defaultDestination =
    cashBankAccounts.find(
      (row) => row.account_subtype === (defaultBookKind === "cash" ? "BANK" : "CASH"),
    )?.id ?? "";
  const [sourceAccountId, setSourceAccountId] = useState(defaultSource);
  const [destinationAccountId, setDestinationAccountId] = useState(defaultDestination);
  const [amount, setAmount] = useState("");
  const [entryDate, setEntryDate] = useState(new Date().toISOString().slice(0, 10));
  const [narration, setNarration] = useState("");

  async function onConfirm() {
    if (!sourceAccountId || !destinationAccountId || !amount.trim()) {
      toast.error("Choose source and destination accounts and enter an amount.");
      return;
    }
    try {
      const journal = await createContra.mutateAsync({
        source_account_id: sourceAccountId,
        destination_account_id: destinationAccountId,
        amount: amount.trim(),
        entry_date: entryDate || null,
        narration: narration.trim() || null,
      });
      toast.success("Contra journal draft created");
      onOpenChange(false);
      router.push(`/journals/${journal.id}`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  const accountOptions = cashBankAccounts.map((account) => ({
    value: account.id,
    label: `${account.code} — ${account.name}`,
  }));

  return (
    <ConfirmActionDialog
      open={open}
      title="Cash / bank transfer"
      description="Creates a draft manual journal debiting the destination account and crediting the source. Post the journal when you are ready."
      confirmLabel="Create draft"
      pending={createContra.isPending}
      onConfirm={() => void onConfirm()}
      onOpenChange={onOpenChange}
      extra={
        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="contra-source">From (credit)</Label>
            <MasterSelect
              placeholder="Source account"
              value={sourceAccountId}
              onValueChange={setSourceAccountId}
              options={accountOptions}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="contra-destination">To (debit)</Label>
            <MasterSelect
              placeholder="Destination account"
              value={destinationAccountId}
              onValueChange={setDestinationAccountId}
              options={accountOptions}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="contra-amount">Amount</Label>
            <Input
              id="contra-amount"
              inputMode="decimal"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="contra-date">Date</Label>
            <Input
              id="contra-date"
              type="date"
              value={entryDate}
              onChange={(event) => setEntryDate(event.target.value)}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="contra-narration">Narration</Label>
            <Textarea
              id="contra-narration"
              rows={2}
              value={narration}
              onChange={(event) => setNarration(event.target.value)}
            />
          </div>
        </div>
      }
    />
  );
}

export function ContraEntryDialog(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultBookKind?: "cash" | "bank";
}) {
  return <ContraEntryDialogContent key={props.open ? "open" : "closed"} {...props} />;
}
