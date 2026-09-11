"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { useCustomerOpenItems } from "@/modules/crm/customers/queries";
import { useApplySalesInvoiceCredits } from "@/modules/erp/sales-invoices/mutations";
import type { SalesInvoice } from "@/modules/erp/sales-invoices/schemas";
import { getErrorMessage } from "@/shared/api/errors";
import {
  PaymentAllocationEditor,
  paymentAllocationsPayload,
} from "@/shared/components/document/payment-allocation-editor";
import type { OpenItemType } from "@/shared/components/document/schemas";
import { ConfirmActionDialog } from "@/shared/components/feedback/confirm-action-dialog";

const CREDIT_ITEM_TYPES = new Set<OpenItemType>(["CREDIT_NOTE", "CUSTOMER_PAYMENT"]);

export function ApplyCreditsDialog({
  invoice,
  currencyCode,
  open,
  onOpenChange,
}: {
  invoice: SalesInvoice;
  currencyCode: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const openItemsQuery = useCustomerOpenItems(invoice.customer_id, open);
  const applyCredits = useApplySalesInvoiceCredits();
  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setValues({});
    }
  }, [open]);

  const items = (openItemsQuery.data ?? []).filter((item) => CREDIT_ITEM_TYPES.has(item.item_type));

  async function onConfirm() {
    const allocations = paymentAllocationsPayload(items, values);
    try {
      await applyCredits.mutateAsync({
        id: invoice.id,
        version: invoice.version,
        allocations: allocations.length > 0 ? allocations : null,
      });
      toast.success("Credits applied");
      onOpenChange(false);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <ConfirmActionDialog
      open={open}
      title="Apply credits"
      description="Match unapplied credit notes and receipts to this invoice. Leave amounts empty to apply everything the server can match. This does not move bank."
      extra={
        <PaymentAllocationEditor
          items={items}
          values={values}
          onChange={(itemId, amount) => setValues((current) => ({ ...current, [itemId]: amount }))}
          currencyCode={currencyCode}
          received={invoice.balance_due}
          bankCharges="0"
          emptyMessage="No unapplied credits or receipts for this customer."
        />
      }
      confirmLabel="Apply"
      pending={applyCredits.isPending}
      variant="default"
      onOpenChange={onOpenChange}
      onConfirm={() => void onConfirm()}
    />
  );
}
