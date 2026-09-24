"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { OPTIONAL_SELECT_NONE } from "@/config/constants";
import { isCashOrBankAccount } from "@/modules/erp/accounting/accounts/schemas";
import { useAllAccounts } from "@/modules/erp/accounting/accounts/queries";
import { useAllCurrencies } from "@/modules/erp/currencies/queries";
import { useRefundDebitNote } from "@/modules/erp/debit-notes/mutations";
import type { DebitNote } from "@/modules/erp/debit-notes/schemas";
import { getErrorMessage } from "@/shared/api/errors";
import { MasterSelect } from "@/shared/components/form/master-select";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Label } from "@/shared/components/ui/label";
import { formatMoney } from "@/shared/lib/format";

export function DebitNoteRefundDialog({
  note,
  open,
  onOpenChange,
}: {
  note: DebitNote;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const refund = useRefundDebitNote();
  const currenciesQuery = useAllCurrencies();
  const accountsQuery = useAllAccounts();
  const currencyCode =
    currenciesQuery.data?.find((currency) => currency.id === note.currency_id)?.code ?? "";
  const paymentAccounts = (accountsQuery.data ?? []).filter(isCashOrBankAccount);
  const [paymentAccountId, setPaymentAccountId] = useState(OPTIONAL_SELECT_NONE);

  useEffect(() => {
    if (!open) {
      setPaymentAccountId(OPTIONAL_SELECT_NONE);
    }
  }, [open]);

  async function onSubmit() {
    if (paymentAccountId === OPTIONAL_SELECT_NONE) {
      toast.error("Select a payment account.");
      return;
    }
    try {
      await refund.mutateAsync({
        id: note.id,
        version: note.version,
        payment_account_id: paymentAccountId,
      });
      toast.success("Unapplied debit refunded");
      onOpenChange(false);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Refund unapplied debit</DialogTitle>
          <DialogDescription>
            Receive {formatMoney(note.amount_unapplied, currencyCode)} from this debit note into a cash or bank
            account. AP will decrease and the payment account will debit.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-1.5">
          <Label>Payment account</Label>
          <MasterSelect
            value={paymentAccountId}
            onValueChange={setPaymentAccountId}
            disabled={accountsQuery.isLoading || refund.isPending}
            placeholder="Cash or bank"
            searchPlaceholder="Search account…"
            options={[
              { value: OPTIONAL_SELECT_NONE, label: "Select an account" },
              ...paymentAccounts.map((account) => ({
                value: account.id,
                label: `${account.code} — ${account.name}`,
              })),
            ]}
          />
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" variant="destructive" disabled={refund.isPending} onClick={onSubmit}>
            {refund.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            Refund
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
