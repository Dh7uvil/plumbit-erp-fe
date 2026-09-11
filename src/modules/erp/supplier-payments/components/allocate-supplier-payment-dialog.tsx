"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { useAllocateSupplierPayment } from "@/modules/erp/supplier-payments/mutations";
import type { SupplierPayment } from "@/modules/erp/supplier-payments/schemas";
import { useSupplierOpenItems } from "@/modules/erp/suppliers/queries";
import { getErrorMessage } from "@/shared/api/errors";
import {
  PaymentAllocationEditor,
  paymentAllocationsPayload,
} from "@/shared/components/document/payment-allocation-editor";
import { ConfirmActionDialog } from "@/shared/components/feedback/confirm-action-dialog";

export function AllocateSupplierPaymentDialog({
  payment,
  currencyCode,
  open,
  onOpenChange,
}: {
  payment: SupplierPayment;
  currencyCode: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const openItemsQuery = useSupplierOpenItems(payment.supplier_id, open);
  const allocate = useAllocateSupplierPayment();
  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setValues({});
    }
  }, [open]);

  const items = openItemsQuery.data ?? [];

  async function onConfirm() {
    const allocations = paymentAllocationsPayload(items, values);
    if (allocations.length === 0) {
      toast.error("Enter an amount to apply.");
      return;
    }
    try {
      await allocate.mutateAsync({ id: payment.id, version: payment.version, allocations });
      toast.success("Payment allocated");
      onOpenChange(false);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <ConfirmActionDialog
      open={open}
      title={`Allocate ${payment.display_number || payment.document_number}`}
      description="Apply the unapplied remainder to open bills. This does not move bank again."
      extra={
        <PaymentAllocationEditor
          items={items}
          values={values}
          onChange={(itemId, amount) => setValues((current) => ({ ...current, [itemId]: amount }))}
          currencyCode={currencyCode}
          received={payment.amount_unapplied}
          bankCharges={payment.bank_charges}
          unapplied={payment.amount_unapplied}
        />
      }
      confirmLabel="Allocate"
      pending={allocate.isPending}
      variant="default"
      onOpenChange={onOpenChange}
      onConfirm={() => void onConfirm()}
    />
  );
}
