"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { useApplyPurchaseInvoiceDebits } from "@/modules/erp/purchase-invoices/mutations";
import type { PurchaseInvoice } from "@/modules/erp/purchase-invoices/schemas";
import { useSupplierOpenItems } from "@/modules/erp/suppliers/queries";
import { getErrorMessage } from "@/shared/api/errors";
import {
  PaymentAllocationEditor,
  paymentAllocationsPayload,
} from "@/shared/components/document/payment-allocation-editor";
import type { OpenItemType } from "@/shared/components/document/schemas";
import { ConfirmActionDialog } from "@/shared/components/feedback/confirm-action-dialog";

const DEBIT_ITEM_TYPES = new Set<OpenItemType>(["DEBIT_NOTE", "SUPPLIER_PAYMENT"]);

export function ApplyDebitsDialog({
  invoice,
  currencyCode,
  open,
  onOpenChange,
}: {
  invoice: PurchaseInvoice;
  currencyCode: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const openItemsQuery = useSupplierOpenItems(invoice.supplier_id, open);
  const applyDebits = useApplyPurchaseInvoiceDebits();
  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setValues({});
    }
  }, [open]);

  const items = (openItemsQuery.data ?? []).filter((item) => DEBIT_ITEM_TYPES.has(item.item_type));

  async function onConfirm() {
    const allocations = paymentAllocationsPayload(items, values);
    try {
      await applyDebits.mutateAsync({
        id: invoice.id,
        version: invoice.version,
        allocations: allocations.length > 0 ? allocations : null,
      });
      toast.success("Debits applied");
      onOpenChange(false);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <ConfirmActionDialog
      open={open}
      title="Apply debits"
      description="Match unapplied debit notes and supplier payments to this bill. Leave amounts empty to apply everything the server can match. This does not move bank."
      extra={
        <PaymentAllocationEditor
          items={items}
          values={values}
          onChange={(itemId, amount) => setValues((current) => ({ ...current, [itemId]: amount }))}
          currencyCode={currencyCode}
          received={invoice.balance_due}
          bankCharges="0"
          emptyMessage="No unapplied debit notes or payments for this supplier."
        />
      }
      confirmLabel="Apply"
      pending={applyDebits.isPending}
      variant="default"
      onOpenChange={onOpenChange}
      onConfirm={() => void onConfirm()}
    />
  );
}
