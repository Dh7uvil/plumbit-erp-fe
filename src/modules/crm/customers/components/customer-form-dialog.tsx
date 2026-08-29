"use client";

import { CustomerForm } from "@/modules/crm/customers/components/customer-form";
import type { Customer } from "@/modules/crm/customers/schemas";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";

export function CustomerFormDialog({
  open,
  customer,
  onOpenChange,
}: {
  open: boolean;
  customer: Customer | null;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{customer ? "Edit Customer" : "New Customer"}</DialogTitle>
        </DialogHeader>
        <CustomerForm
          customer={customer}
          showCancel
          onCancel={() => onOpenChange(false)}
          onSuccess={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
